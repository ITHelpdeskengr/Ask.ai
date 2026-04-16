const { google } = require('googleapis');
const nodemailer = require('nodemailer');

/**
 * Service to handle Google Authentication via Service Account with Domain-Wide Delegation.
 * Used for impersonating users in a Google Workspace domain.
 */
class GoogleAuthService {
  constructor() {
    // Sanitize credentials by trimming whitespace and removing potential quotes
    this.email = (process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || '').trim().replace(/^["']|["']$/g, '');
    let rawKey = (process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY || '').trim().replace(/^["']|["']$/g, '');
    
    // Step 1: Normalize all escaped \n sequences into real newlines
    rawKey = rawKey.replace(/\\n/g, '\n');
    const headerMatch = rawKey.match(/(-----BEGIN [^-]+-----)([\s\S]*?)(-----END [^-]+-----)/);
    
    if (headerMatch) {
      const header = headerMatch[1];
      const footer = headerMatch[3];
      // Strip whitespace and any non-base64 chars (stray backslashes from corrupted \n escapes)
      const body = headerMatch[2]
        .replace(/\s/g, '')
        .replace(/[^A-Za-z0-9+/=]/g, '');
      const wrappedBody = body.match(/.{1,64}/g).join('\n');
      this.privateKey = `${header}\n${wrappedBody}\n${footer}\n`;
    } else {
      this.privateKey = rawKey;
    }

    if (this.isConfigured()) {
      console.log(`[GoogleAuth] Initialized with Service Account: ${this.email.substring(0, 5)}...${this.email.substring(this.email.indexOf('@'))}`);
    } else {
      console.warn('[GoogleAuth] Service Account not fully configured. Will attempt Nodemailer fallback if credentials exist.');
    }
  }

  isConfigured() {
    // If the flag is explicitly set to disable, return false (case-insensitive & trimmed)
    const disableFlag = (process.env.DISABLE_SECURITY_CHALLENGE || '').toLowerCase().trim();
    if (disableFlag === 'true') return false;

    // Check if variables are missing or use placeholder values
    if (!this.email || !this.privateKey) return false;
    
    // Check for common placeholder patterns
    const isPlaceholderEmail = this.email.includes('your-service-account') || 
                               this.email.includes('your.email') || 
                               this.email === '';
                               
    const isPlaceholderKey = this.privateKey.includes('-----BEGIN PRIVATE KEY-----') === false || 
                             this.privateKey === '';

    if (isPlaceholderEmail || isPlaceholderKey) return false;

    return true;
  }

  /**
   * Helper to send via Nodemailer (SMTP)
   */
  async sendViaNodemailer(toEmail, subject, htmlContent) {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      throw new Error('Neither Google Service Account nor Nodemailer (EMAIL_USER/PASS) are configured.');
    }

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    await transporter.sendMail({
      from: `"${process.env.APP_NAME || 'Ask.ai Assistant'}" <${process.env.EMAIL_USER}>`,
      to: toEmail,
      subject: subject,
      html: htmlContent
    });

    console.log(`[GoogleAuth] Security code sent successfully via Nodemailer (SMTP) to ${toEmail}`);
  }

  /**
   * Returns an authorized JWT client for a specific user to impersonate.
   * @param {string} targetUserEmail - The email of the user to impersonate.
   * @param {string[]} [scopes] - Optional list of OAuth scopes. Defaults to Gmail Send.
   * @returns {import('googleapis').Auth.JWT}
   */
  getImpersonatedClient(targetUserEmail, scopes = ['https://www.googleapis.com/auth/gmail.send']) {
    if (!this.isConfigured()) {
      throw new Error('Google Service Account credentials are not configured or are set to placeholders.');
    }

    // Using robust options-object format for JWT with delegation
    return new google.auth.JWT({
      email: this.email,
      key: this.privateKey,
      scopes: scopes,
      subject: targetUserEmail
    });
  }

  /**
   * Returns a Gmail API instance authorized for a specific user.
   * @param {string} targetUserEmail 
   */
  getGmailClient(targetUserEmail) {
    const auth = this.getImpersonatedClient(targetUserEmail);
    return google.gmail({ version: 'v1', auth });
  }

  sendSecurityCode = async (toEmail, code) => {
    const adminEmail = process.env.GOOGLE_ADMIN_USER;
    const subject = 'Your Ask.ai Security Code';
    
    const htmlContent = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
        <h2 style="color: #3a86ff;">Ask.ai Security Challenge</h2>
        <p>To access your account, please enter the following 6-digit verification code:</p>
        <div style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #333; padding: 20px; background: #f8f9fa; text-align: center; border-radius: 8px; margin: 20px 0;">
          ${code}
        </div>
        <p style="color: #666; font-size: 14px;">This code will expire in 10 minutes. If you did not request this code, please ignore this email.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="font-size: 12px; color: #999;">&copy; 2026 Ask.ai Platform. All rights reserved.</p>
      </div>
    `;

    let gmailError = null;

    // Attempt Gmail API (Service Account) if configured
    if (this.isConfigured()) {
      try {
        const gmail = this.getGmailClient(adminEmail || 'admin@ask.ai');
        const utf8Subject = `=?utf-8?B?${Buffer.from(subject).toString('base64')}?=`;
        const messagePart = [
          `From: "Ask.ai Security" <${adminEmail || 'admin@ask.ai'}>`,
          `To: ${toEmail}`,
          `Content-Type: text/html; charset=utf-8`,
          `MIME-Version: 1.0`,
          `Subject: ${utf8Subject}`,
          '',
          htmlContent
        ].join('\r\n');

        const encodedMessage = Buffer.from(messagePart)
          .toString('base64')
          .replace(/\+/g, '-')
          .replace(/\//g, '_')
          .replace(/=+$/, '');

        await gmail.users.messages.send({
          userId: 'me',
          requestBody: { raw: encodedMessage },
        });
        console.log(`[GoogleAuth] Security code sent successfully via Gmail API (Service Account) to ${toEmail}`);
        return;
      } catch (err) {
        gmailError = err;
        console.warn(`[GoogleAuth] Gmail API impersonation failed: ${err.message}. Falling back to Nodemailer...`);
      }
    }

    // Fallback to Nodemailer
    try {
      await this.sendViaNodemailer(toEmail, subject, htmlContent);
    } catch (smtpErr) {
      // Re-throw with more context if we have a gmail error too
      if (gmailError) {
        throw new Error(`Email delivery failed. [Gmail API]: ${gmailError.message}. [SMTP Fallback]: ${smtpErr.message}`);
      }
      throw smtpErr;
    }
  }
}

module.exports = new GoogleAuthService();
