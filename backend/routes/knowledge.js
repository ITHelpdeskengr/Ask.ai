const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const Tesseract = require('tesseract.js');
const { parseOfficeAsync } = require('officeparser');
const os = require('os');
const { v4: uuidv4 } = require('uuid');
const Knowledge = require('../models/Knowledge');
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');
const driveSync = require('../services/driveSync');

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = [
    'application/pdf',
    'text/plain',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document' // docx
  ];
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only PDF, DOCX, and TXT are allowed for the knowledge base.'), false);
  }
};

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB limit
  fileFilter: fileFilter
});

// GET /api/knowledge
router.get('/', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    // Select all fields except 'content' to keep payload small
    const documents = await Knowledge.find({}).select('-content').sort({ createdAt: -1 });
    res.json({ documents });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch knowledge base documents.' });
  }
});

// POST /api/knowledge/upload
router.post('/upload', authMiddleware, adminMiddleware, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded or invalid file format.' });
    }

    const { mimetype, path: filePath, originalname, size } = req.file;
    let extractedText = '';

    // Extract text based on file type
    if (mimetype === 'application/pdf') {
      const dataBuffer = fs.readFileSync(filePath);
      const data = await pdfParse(dataBuffer);
      extractedText = data.text;
    } else if (mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || mimetype === 'application/msword') {
      const result = await mammoth.extractRawText({ path: filePath });
      extractedText = result.value;
    } else if (mimetype === 'text/plain') {
      extractedText = fs.readFileSync(filePath, 'utf8');
    }

    if (!extractedText || extractedText.trim() === '') {
      // Clean up the uploaded file if we couldn't parse text
      fs.unlinkSync(filePath);
      return res.status(400).json({ error: 'Could not extract valid text from the uploaded file.' });
    }

    // Save to database
    const newKnowledge = new Knowledge({
      title: req.body.title || originalname,
      content: extractedText,
      originalFilename: originalname,
      mimeType: mimetype,
      size: size,
      uploadedBy: req.user.id
    });

    await newKnowledge.save();

    // Optionally delete the raw file from disk to save space since text is in DB
    fs.unlinkSync(filePath);

    res.json({ 
      success: true, 
      document: {
        _id: newKnowledge._id,
        title: newKnowledge.title,
        originalFilename: newKnowledge.originalFilename,
        size: newKnowledge.size,
        createdAt: newKnowledge.createdAt
      }
    });

  } catch (err) {
    console.error('[KNOWLEDGE UPLOAD ERROR]', err);
    if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    res.status(500).json({ error: 'Failed to process and upload document.' });
  }
});

// DELETE /api/knowledge/:id
router.delete('/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const deleted = await Knowledge.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Document not found.' });
    res.json({ success: true, message: 'Document removed from knowledge base.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete knowledge document.' });
  }
});

// GET /api/knowledge/sync-config
router.get('/sync-config', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const isConfigured = driveSync.isConfigured();
    const folderId = await driveSync.getSyncFolderId();
    const lastSyncTime = await driveSync.getLastSyncTime();
    
    res.json({
      isServiceAccountConfigured: isConfigured,
      folderId: folderId || '',
      lastSyncTime: lastSyncTime
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch sync config.' });
  }
});

// POST /api/knowledge/sync-config
router.post('/sync-config', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { folderId } = req.body;
    
    if (folderId !== undefined) {
      // Allow empty string to disable/clear the sync
      await driveSync.setSyncFolderId(folderId);
    }

    // Trigger an immediate manual sync when they save
    const syncResult = await driveSync.syncFolder();
    
    if (!syncResult.success && folderId) {
       // If it fails, we still configured it, but warn the user.
       return res.status(400).json({ error: syncResult.message });
    }

    res.json({ success: true, message: syncResult.message || 'Sync configured successfully.' });
  } catch (err) {
    console.error('[DRIVE SYNC API ERROR]', err);
    // Translate common cryptic OpenSSL errors into actionable messages
    let friendlyError = 'Failed to configure or run Google Drive Sync.';
    if (err.message && (err.message.includes('DECODER') || err.message.includes('unsupported') || err.message.includes('ERR_OSSL'))) {
      friendlyError = 'Service Account private key is malformed or corrupted in your .env file. Please regenerate your key from Google Cloud Console → IAM & Admin → Service Accounts → Keys → Add Key.';
    }
    res.status(500).json({ error: friendlyError });
  }
});

// POST /api/knowledge/sync-personal-drive
// Uses the admin's personal Google OAuth token (no Service Account needed)
router.post('/sync-personal-drive', authMiddleware, adminMiddleware, async (req, res) => {
  const { folderId } = req.body;
  const googleToken = req.headers['x-google-token'];

  if (!folderId) return res.status(400).json({ error: 'Folder ID is required.' });
  if (!googleToken) return res.status(401).json({ error: 'Google account not connected. Please sign in with Google first.' });

  try {
    const { google } = require('googleapis');

    const auth = new google.auth.OAuth2();
    auth.setCredentials({ access_token: googleToken });
    const drive = google.drive({ version: 'v3', auth });

    const fetchAllFilesRecursive = async (fid, allFiles = []) => {
      const query = `'${fid}' in parents and trashed = false and (mimeType='application/vnd.google-apps.folder' or mimeType='application/vnd.google-apps.document' or mimeType='application/pdf' or mimeType='text/plain' or mimeType='application/vnd.google-apps.spreadsheet' or mimeType='application/vnd.openxmlformats-officedocument.wordprocessingml.document' or mimeType='application/vnd.openxmlformats-officedocument.presentationml.presentation' or mimeType='image/jpeg' or mimeType='image/png')`;
      const res = await drive.files.list({
        q: query,
        fields: 'files(id, name, mimeType, modifiedTime, size)',
        pageSize: 100
      });
      const items = res.data.files || [];
      for (const item of items) {
        if (item.mimeType === 'application/vnd.google-apps.folder') {
          await fetchAllFilesRecursive(item.id, allFiles);
        } else {
          allFiles.push(item);
        }
      }
      return allFiles;
    };

    const files = await fetchAllFilesRecursive(folderId);
    if (files.length === 0) {
      return res.json({ success: true, message: 'No supported files found in those folders. (Supported: Google Docs, Sheets, PDFs, DOCX, PPTX, Images, TXT)' });
    }

    let syncedCount = 0;
    let skippedCount = 0;

    for (const file of files) {
      try {
        // Skip if already synced and not modified
        const existing = await Knowledge.findOne({ driveFileId: file.id });
        if (existing) {
          const driveTime = new Date(file.modifiedTime).getTime();
          const localTime = existing.lastModifiedTime ? existing.lastModifiedTime.getTime() : 0;
          if (driveTime <= localTime) { skippedCount++; continue; }
        }

        let extractedText = '';

        if (file.mimeType === 'application/vnd.google-apps.document') {
          const expRes = await drive.files.export({ fileId: file.id, mimeType: 'text/plain' });
          extractedText = expRes.data;
        } else if (file.mimeType === 'application/vnd.google-apps.spreadsheet') {
          const expRes = await drive.files.export({ fileId: file.id, mimeType: 'text/csv' });
          extractedText = expRes.data;
        } else if (file.mimeType === 'text/plain') {
          const dlRes = await drive.files.get({ fileId: file.id, alt: 'media' }, { responseType: 'text' });
          extractedText = dlRes.data;
        } else if (file.mimeType === 'application/pdf') {
          const dlRes = await drive.files.get({ fileId: file.id, alt: 'media' }, { responseType: 'arraybuffer' });
          const parsed = await pdfParse(Buffer.from(dlRes.data));
          extractedText = parsed.text;
        } else if (file.mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
          const dlRes = await drive.files.get({ fileId: file.id, alt: 'media' }, { responseType: 'arraybuffer' });
          const mammothResult = await mammoth.extractRawText({ buffer: Buffer.from(dlRes.data) });
          extractedText = mammothResult.value;
        } else if (file.mimeType === 'application/vnd.openxmlformats-officedocument.presentationml.presentation') {
          const dlRes = await drive.files.get({ fileId: file.id, alt: 'media' }, { responseType: 'arraybuffer' });
          const tempPath = path.join(os.tmpdir(), `${uuidv4()}.pptx`);
          fs.writeFileSync(tempPath, Buffer.from(dlRes.data));
          try { extractedText = await parseOfficeAsync(tempPath); } finally { fs.unlinkSync(tempPath); }
        } else if (file.mimeType === 'image/jpeg' || file.mimeType === 'image/png') {
          const dlRes = await drive.files.get({ fileId: file.id, alt: 'media' }, { responseType: 'arraybuffer' });
          const result = await Tesseract.recognize(Buffer.from(dlRes.data), 'eng');
          extractedText = result.data.text;
        }

        if (!extractedText || extractedText.trim() === '') continue;

        if (existing) {
          existing.content = extractedText;
          existing.lastModifiedTime = new Date(file.modifiedTime);
          existing.size = file.size ? parseInt(file.size, 10) : 0;
          await existing.save();
        } else {
          await new Knowledge({
            title: file.name,
            content: extractedText,
            originalFilename: file.name,
            mimeType: file.mimeType,
            size: file.size ? parseInt(file.size, 10) : 0,
            driveFileId: file.id,
            isDriveSync: true,
            lastModifiedTime: new Date(file.modifiedTime),
            uploadedBy: req.user.id
          }).save();
        }
        syncedCount++;
      } catch (fileErr) {
        console.error(`[PERSONAL DRIVE SYNC] Failed to process file ${file.name}:`, fileErr.message);
      }
    }

    res.json({
      success: true,
      message: `✅ Synced ${syncedCount} file(s) from your Google Drive. ${skippedCount > 0 ? `(${skippedCount} already up-to-date, skipped)` : ''}`
    });

  } catch (err) {
    console.error('[PERSONAL DRIVE SYNC ERROR]', err.message);
    if (err.code === 401 || err.message?.includes('invalid_grant') || err.message?.includes('Invalid Credentials')) {
      return res.status(401).json({ error: 'Google session expired. Please reconnect your Google account.' });
    }
    if (err.message?.includes('notFound') || err.code === 404) {
      return res.status(404).json({ error: 'Folder not found. Make sure the Folder ID is correct and you have access to it.' });
    }
    res.status(500).json({ error: `Sync failed: ${err.message}` });
  }
});

module.exports = router;

