const { google } = require('googleapis');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const Knowledge = require('../models/Knowledge');
const Settings = require('../models/Settings');
const Tesseract = require('tesseract.js');
const { parseOfficeAsync } = require('officeparser');
const os = require('os');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');


class DriveSyncService {
  constructor() {
    // Sanitize credentials by trimming whitespace and removing potential quotes
    this.email = (process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || '').trim().replace(/^["']|["']$/g, '');
    let rawKey = (process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY || '').trim().replace(/^["']|["']$/g, '');
    
    // Step 1: Normalize all escaped \n sequences into real newlines
    rawKey = rawKey.replace(/\\n/g, '\n');
    
    // Step 2: Header-agnostic PEM extraction
    const pemPartMatch = rawKey.match(/(-----BEGIN [^-]+-----)([\s\S]*?)(-----END [^-]+-----)/);
    
    if (pemPartMatch) {
      const header = pemPartMatch[1];
      const footer = pemPartMatch[3];
      // Step 3: Strip ALL whitespace, then scrub any non-base64 chars (e.g. stray backslashes
      // from corrupted \n escapes like rik38\Q instead of rik38\nQ in the .env file)
      const body = pemPartMatch[2]
        .replace(/\s/g, '')
        .replace(/[^A-Za-z0-9+/=]/g, '');
      
      // Step 4: Re-wrap at standard 64-char PEM line length
      const wrappedBody = body.match(/.{1,64}/g).join('\n');
      this.privateKey = `${header}\n${wrappedBody}\n${footer}\n`;
    } else {
      this.privateKey = rawKey;
    }

    if (this.isConfigured()) {
      console.log(`[DriveSync] Initialized with Service Account: ${this.email.substring(0, 5)}...${this.email.substring(this.email.indexOf('@'))}`);
      // Test the key decoding immediately
      try {
        this.getAuthClient();
        console.log('[DriveSync] Authentication client generated successfully.');
      } catch (err) {
        console.error('[DriveSync] FAILED to initialize auth client. Private key may be malformed:', err.message);
      }
    } else {
      console.warn('[DriveSync] Service Account not fully configured. Knowledge Base sync will not work.');
    }
  }

  isConfigured() {
    if (!this.email || !this.privateKey) return false;
    if (this.email.includes('your-service-account') || this.email === '') return false;
    if (this.privateKey.includes('-----BEGIN PRIVATE KEY-----') === false || this.privateKey === '') return false;
    return true;
  }

  getAuthClient() {
    if (!this.isConfigured()) return null;
    // Using the more robust options-object format for JWT
    return new google.auth.JWT({
      email: this.email,
      key: this.privateKey,
      scopes: ['https://www.googleapis.com/auth/drive.readonly']
    });
  }

  async getSyncFolderId() {
    const setting = await Settings.findOne({ key: 'knowledgeDriveFolderId' });
    return setting ? setting.value : null;
  }

  async setSyncFolderId(folderId) {
    await Settings.findOneAndUpdate(
      { key: 'knowledgeDriveFolderId' },
      { value: folderId },
      { upsert: true, new: true }
    );
  }

  async getLastSyncTime() {
    const setting = await Settings.findOne({ key: 'knowledgeLastSyncTime' });
    return setting ? setting.value : null;
  }

  async updateLastSyncTime() {
    await Settings.findOneAndUpdate(
      { key: 'knowledgeLastSyncTime' },
      { value: new Date().toISOString() },
      { upsert: true }
    );
  }

  async parseDriveFile(drive, fileId, mimeType) {
    try {
      if (mimeType === 'application/vnd.google-apps.document') {
        const res = await drive.files.export({ fileId, mimeType: 'text/plain' });
        return res.data;
      } else if (mimeType === 'application/pdf') {
        const res = await drive.files.get({ fileId, alt: 'media' }, { responseType: 'arraybuffer' });
        const data = await pdfParse(Buffer.from(res.data));
        return data.text;
      } else if (mimeType === 'text/plain') {
        const res = await drive.files.get({ fileId, alt: 'media' });
        return res.data;
      } else if (mimeType === 'application/vnd.google-apps.spreadsheet') {
        const res = await drive.files.export({ fileId, mimeType: 'text/csv' });
        return res.data;
      } else if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        const res = await drive.files.get({ fileId, alt: 'media' }, { responseType: 'arraybuffer' });
        const mammothResult = await mammoth.extractRawText({ buffer: Buffer.from(res.data) });
        return mammothResult.value;
      } else if (mimeType === 'application/vnd.openxmlformats-officedocument.presentationml.presentation') {
        const res = await drive.files.get({ fileId, alt: 'media' }, { responseType: 'arraybuffer' });
        const tempPath = path.join(os.tmpdir(), `${uuidv4()}.pptx`);
        fs.writeFileSync(tempPath, Buffer.from(res.data));
        try {
          const text = await parseOfficeAsync(tempPath);
          return text;
        } finally {
          if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
        }
      } else if (mimeType === 'image/jpeg' || mimeType === 'image/png') {
        const res = await drive.files.get({ fileId, alt: 'media' }, { responseType: 'arraybuffer' });
        const result = await Tesseract.recognize(Buffer.from(res.data), 'eng');
        return result.data.text;
      }
    } catch (err) {
      console.error(`[DriveSync] Failed to parse file ${fileId} (${mimeType}):`, err.message);
    }
    return null;
  }

  async syncFolder() {
    const folderId = await this.getSyncFolderId();
    if (!folderId) return { success: false, message: 'No Google Drive folder ID configured.' };

    const auth = this.getAuthClient();
    if (!auth) return { success: false, message: 'Google Service Account not configured.' };

    const drive = google.drive({ version: 'v3', auth });

    let files = [];
    try {
      const fetchAllFilesRecursive = async (fid, allFiles = []) => {
        // List supported files AND folders
        const query = `'${fid}' in parents and trashed = false and (mimeType='application/vnd.google-apps.folder' or mimeType='application/vnd.google-apps.document' or mimeType='application/pdf' or mimeType='text/plain' or mimeType='application/vnd.google-apps.spreadsheet' or mimeType='application/vnd.openxmlformats-officedocument.wordprocessingml.document' or mimeType='application/vnd.openxmlformats-officedocument.presentationml.presentation' or mimeType='image/jpeg' or mimeType='image/png')`;
        const res = await drive.files.list({
          auth,
          q: query,
          fields: 'files(id, name, mimeType, modifiedTime, size)',
          pageSize: 100
        });
        
        const folderItems = res.data.files || [];
        for (const item of folderItems) {
          if (item.mimeType === 'application/vnd.google-apps.folder') {
            await fetchAllFilesRecursive(item.id, allFiles);
          } else {
            allFiles.push(item);
          }
        }
        return allFiles;
      };

      files = await fetchAllFilesRecursive(folderId);
    } catch (err) {
      console.error('[DriveSync] API Error Details:', err.response?.data || err.message);
      return { success: false, message: `Failed to access Google Drive: ${err.message}. Check permissions and Folder ID.` };
    }

    let syncedCount = 0;
    
    for (const file of files) {
      // Check if we already have this file synced and if it's up to date
      const existing = await Knowledge.findOne({ driveFileId: file.id });
      
      if (existing) {
        // Check timestamps
        const driveModifiedTime = new Date(file.modifiedTime).getTime();
        const localModifiedTime = existing.lastModifiedTime ? existing.lastModifiedTime.getTime() : 0;
        
        if (driveModifiedTime <= localModifiedTime) {
          continue; // File hasn't changed, skip parsing
        }
      }

      console.log(`[DriveSync] Syncing file: ${file.name}`);
      const extractedText = await this.parseDriveFile(drive, file.id, file.mimeType);

      if (extractedText && extractedText.trim() !== '') {
        if (existing) {
          // Update existing document
          existing.content = extractedText;
          existing.lastModifiedTime = file.modifiedTime;
          existing.size = file.size ? parseInt(file.size, 10) : 0;
          await existing.save();
        } else {
          // Create new synced document
          const newKnowledge = new Knowledge({
            title: file.name,
            content: extractedText,
            originalFilename: file.name,
            mimeType: file.mimeType,
            size: file.size ? parseInt(file.size, 10) : 0,
            driveFileId: file.id,
            isDriveSync: true,
            lastModifiedTime: file.modifiedTime
          });
          await newKnowledge.save();
        }
        syncedCount++;
      }
    }

    await this.updateLastSyncTime();
    return { success: true, message: `Synced ${syncedCount} file(s). Total supported files detected: ${files.length}.` };
  }
}

module.exports = new DriveSyncService();
