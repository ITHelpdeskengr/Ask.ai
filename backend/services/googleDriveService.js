const { google } = require('googleapis');

const googleDriveService = {
  getClient(token) {
    const auth = new google.auth.OAuth2();
    auth.setCredentials({ access_token: token });
    return google.drive({ version: 'v3', auth });
  },

  async searchFiles(token, query) {
    const drive = this.getClient(token);
    try {
      const gRes = await drive.files.list({
        q: `(name contains '${query}' or fullText contains '${query}') and trashed = false`,
        fields: 'files(id, name, mimeType, description, webViewLink, modifiedTime)',
        pageSize: 10,
        orderBy: 'relevance'
      });
      return gRes.data.files || [];
    } catch (err) {
      console.error('[GOOGLE DRIVE SEARCH ERROR]', err.message);
      throw err;
    }
  },

  async getFileContent(token, fileId, mimeType) {
    const drive = this.getClient(token);
    try {
      // If it's a Google Doc/Sheet/Slide, export it as plain text
      if (mimeType.startsWith('application/vnd.google-apps.')) {
        let exportMime = 'text/plain';
        if (mimeType.includes('spreadsheet')) exportMime = 'text/csv';
        
        const gRes = await drive.files.export({
          fileId,
          mimeType: exportMime
        });
        return gRes.data;
      }

      // Otherwise, try to download as media
      const gRes = await drive.files.get({
        fileId,
        alt: 'media'
      }, { responseType: 'text' });
      return gRes.data;
    } catch (err) {
      console.error('[GOOGLE DRIVE READ ERROR]', err.message);
      return `Error: Could not read file content. (${err.message})`;
    }
  }
};

module.exports = googleDriveService;
