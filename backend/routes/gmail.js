const express = require('express');
const router = express.Router();
const { google } = require('googleapis');
const authMiddleware = require('../middleware/authMiddleware');
const fs = require('fs');
const path = require('path');

/**
 * GET /api/gmail/list
 * Fetches the 5 most recent emails from the user's Gmail account.
 * Requires an 'x-gmail-token' header from the frontend.
 */
router.get('/list', authMiddleware, async (req, res) => {
  const gmailToken = req.headers['x-gmail-token'];

  if (!gmailToken) {
    return res.status(400).json({ error: 'Gmail access token is missing. Please grant permission first.' });
  }

  try {
    const auth = new google.auth.OAuth2();
    auth.setCredentials({ access_token: gmailToken });

    const gmail = google.gmail({ version: 'v1', auth });

    // 1. Get message list
    const listRes = await gmail.users.messages.list({
      userId: 'me',
      maxResults: 5,
      q: '-category:social -category:promotions' // Filter out bulk mail for better AI context
    });

    const messages = listRes.data.messages || [];
    const emailData = [];

    // 2. Fetch details for each message
    for (const msg of messages) {
      const detail = await gmail.users.messages.get({
        userId: 'me',
        id: msg.id,
        format: 'full'
      });

      const headers = detail.data.payload.headers;
      const getHeader = (name) => headers.find(h => h.name.toLowerCase() === name.toLowerCase())?.value;

      let body = '';
      if (detail.data.snippet) {
        body = detail.data.snippet;
      }

      emailData.push({
        id: msg.id,
        threadId: msg.threadId,
        from: getHeader('From'),
        subject: getHeader('Subject'),
        date: getHeader('Date'),
        snippet: body
      });
    }

    res.json({
      success: true,
      emails: emailData,
      count: emailData.length
    });

  } catch (err) {
    console.error('[GMAIL API ERROR]', err.response?.data || err.message);
    res.status(500).json({ error: 'Failed to fetch Gmail data: ' + (err.response?.data?.error_description || err.message) });
  }
});

/**
 * POST /api/gmail/send
 * Sends an email on behalf of the user, optionally with a file attachment.
 */
router.post('/send', authMiddleware, async (req, res) => {
  const gmailToken = req.headers['x-gmail-token'];
  const { to, subject, text, attachmentPath } = req.body;

  if (!gmailToken) return res.status(400).json({ error: 'Gmail access token missing' });
  if (!to || !subject || !text) return res.status(400).json({ error: 'to, subject, and text are required' });

  try {
    const auth = new google.auth.OAuth2();
    auth.setCredentials({ access_token: gmailToken });
    const gmail = google.gmail({ version: 'v1', auth });

    // Build MIME message manually
    const boundary = 'ask_ai_boundary_' + Date.now().toString(16);
    let messageParts = [
      `To: ${to}`,
      `Subject: ${subject}`,
      'MIME-Version: 1.0',
      `Content-Type: multipart/mixed; boundary="${boundary}"`,
      '',
      `--${boundary}`,
      'Content-Type: text/plain; charset="utf-8"',
      'Content-Transfer-Encoding: 7bit',
      '',
      text,
    ];

    if (attachmentPath && fs.existsSync(attachmentPath)) {
      const fileName = path.basename(attachmentPath);
      const fileData = fs.readFileSync(attachmentPath).toString('base64');
      messageParts = messageParts.concat([
        '',
        `--${boundary}`,
        `Content-Type: application/octet-stream; name="${fileName}"`,
        `Content-Disposition: attachment; filename="${fileName}"`,
        'Content-Transfer-Encoding: base64',
        '',
        fileData
      ]);
    }

    messageParts.push('', `--${boundary}--`, '');
    const mimeString = messageParts.join('\r\n');
    
    // Base64URL encode
    const raw = Buffer.from(mimeString).toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    const response = await gmail.users.messages.send({
      userId: 'me',
      requestBody: { raw },
    });

    res.json({ success: true, messageId: response.data.id });
  } catch (err) {
    console.error('[GMAIL SEND ERROR]', err.response?.data || err.message);
    res.status(500).json({ error: 'Failed to send email' });
  }
});

/**
 * POST /api/gmail/send-delegated
 * Sends an email on behalf of ANOTHER user (Domain-Wide Delegation).
 * Requires Super Admin approval in Workspace Console.
 */
router.post('/send-delegated', authMiddleware, async (req, res) => {
  const { fromUser, to, subject, text, attachmentPath } = req.body;
  const googleAuthService = require('../services/googleAuthService');

  if (!fromUser || !to || !subject || !text) {
    return res.status(400).json({ error: 'fromUser, to, subject, and text are required' });
  }

  try {
    const auth = googleAuthService.getImpersonatedClient(fromUser, ['https://www.googleapis.com/auth/gmail.send']);
    const gmail = google.gmail({ version: 'v1', auth });

    // Build MIME message manually
    const boundary = 'ask_ai_delegated_boundary_' + Date.now().toString(16);
    let messageParts = [
      `From: ${fromUser}`,
      `To: ${to}`,
      `Subject: ${subject}`,
      'MIME-Version: 1.0',
      `Content-Type: multipart/mixed; boundary="${boundary}"`,
      '',
      `--${boundary}`,
      'Content-Type: text/plain; charset="utf-8"',
      'Content-Transfer-Encoding: 7bit',
      '',
      text,
    ];

    if (attachmentPath && fs.existsSync(attachmentPath)) {
      const fileName = path.basename(attachmentPath);
      const fileData = fs.readFileSync(attachmentPath).toString('base64');
      messageParts = messageParts.concat([
        '',
        `--${boundary}`,
        `Content-Type: application/octet-stream; name="${fileName}"`,
        `Content-Disposition: attachment; filename="${fileName}"`,
        'Content-Transfer-Encoding: base64',
        '',
        fileData
      ]);
    }

    messageParts.push('', `--${boundary}--`, '');
    const mimeString = messageParts.join('\r\n');
    
    // Base64URL encode
    const raw = Buffer.from(mimeString).toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    const response = await gmail.users.messages.send({
      userId: fromUser, // Must match the subject
      requestBody: { raw },
    });

    res.json({ 
      success: true, 
      messageId: response.data.id,
      delegatedFrom: fromUser
    });

  } catch (err) {
    console.error('[GMAIL DELEGATED SEND ERROR]', err.response?.data || err.message);
    res.status(500).json({ 
      error: 'Failed to send delegated email. Ensure Domain-Wide Delegation is configured.',
      details: err.response?.data || err.message
    });
  }
});

/**
 * GET /api/gmail/admin/list/:email
 * Fetches the 5 most recent emails for a specific user.
 * Admin only, uses Domain-Wide Delegation.
 */
const adminMiddleware = require('../middleware/adminMiddleware');
router.get('/admin/list/:email', authMiddleware, adminMiddleware, async (req, res) => {
  const { email: targetUserEmail } = req.params;
  const googleAuthService = require('../services/googleAuthService');

  try {
    const gmail = googleAuthService.getGmailClient(targetUserEmail);

    // 1. Get message list
    const listRes = await gmail.users.messages.list({
      userId: targetUserEmail,
      maxResults: 5,
      q: '-category:social -category:promotions'
    });

    const messages = listRes.data.messages || [];
    const emailData = [];

    // 2. Fetch details for each message
    for (const msg of messages) {
      const detail = await gmail.users.messages.get({
        userId: targetUserEmail,
        id: msg.id,
        format: 'full'
      });

      const headers = detail.data.payload.headers;
      const getHeader = (name) => headers.find(h => h.name.toLowerCase() === name.toLowerCase())?.value;

      emailData.push({
        id: msg.id,
        threadId: msg.threadId,
        from: getHeader('From'),
        subject: getHeader('Subject'),
        date: getHeader('Date'),
        snippet: detail.data.snippet
      });
    }

    res.json({
      success: true,
      emails: emailData,
      count: emailData.length,
      targetUser: targetUserEmail
    });

  } catch (err) {
    console.error('[ADMIN GMAIL ERROR]', err.response?.data || err.message);
    res.status(500).json({ error: `Failed to fetch emails for ${targetUserEmail}: ` + (err.response?.data?.error_description || err.message) });
  }
});

module.exports = router;
