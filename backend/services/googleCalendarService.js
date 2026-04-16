const { google } = require('googleapis');

/**
 * Service to handle Google Calendar interactions via Service Account (Delegation)
 * or via individual user OAuth tokens.
 */
class GoogleCalendarService {
  constructor() {
    this.scopes = ['https://www.googleapis.com/auth/calendar', 'https://www.googleapis.com/auth/calendar.events'];
    
    // Sanitize credentials by trimming whitespace and removing potential quotes
    this.email = (process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || '').trim().replace(/^["']|["']$/g, '');
    let rawKey = (process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY || '').trim().replace(/^["']|["']$/g, '');
    
    // Super Clean: Handle escaped \\n, literal \n, and ensure strict PEM format
    rawKey = rawKey.replace(/\\n/g, '\n');
    const headerMatch = rawKey.match(/(-----BEGIN [^-]+-----)([\s\S]*?)(-----END [^-]+-----)/);
    
    if (headerMatch) {
      const header = headerMatch[1];
      const footer = headerMatch[3];
      const body = headerMatch[2].replace(/\s/g, '');
      const match = body.match(/.{1,64}/g);
      const wrappedBody = match ? match.join('\n') : '';
      this.privateKey = `${header}\n${wrappedBody}\n${footer}\n`;
    } else {
      this.privateKey = rawKey;
    }

    if (this.email && this.privateKey.includes('-----BEGIN PRIVATE KEY-----')) {
      // Initialize single instance for reusable general client
      this.jwtClient = this.getAuthClient();
      console.log(`[GoogleCalendar] Initialized with Service Account: ${this.email.substring(0, 5)}...`);
    } else {
      console.warn('[GoogleCalendar] Service Account not fully configured.');
    }
  }

  /**
   * Internal helper to create a JWT client.
   */
  getAuthClient(subject = null) {
    return new google.auth.JWT({
      email: this.email,
      key: this.privateKey,
      scopes: this.scopes,
      subject: subject
    });
  }

  /**
   * Get a Google Calendar client for a specific user.
   * @param {string} userEmail - The email of the user to impersonate.
   * @returns {object} Google Calendar client instance.
   */
  getDelegatedClient(userEmail) {
    if (!this.email || !this.privateKey.includes('-----BEGIN PRIVATE KEY-----')) {
      throw new Error('Service Account for Domain-Wide Delegation is not configured.');
    }
    
    const adminAuth = this.getAuthClient(userEmail);
    return google.calendar({ version: 'v3', auth: adminAuth });
  }

  /**
   * Get a Google Calendar client using an individual user's OAuth token.
   * @param {string} accessToken - The user's Google access token.
   * @returns {object} Google Calendar client instance.
   */
  getOAuthClient(accessToken) {
    const auth = new google.auth.OAuth2();
    auth.setCredentials({ access_token: accessToken });
    return google.calendar({ version: 'v3', auth });
  }

  /**
   * Helper to determine which client to use based on availability.
   */
  getClient(accessToken, userEmail) {
    if (accessToken) return this.getOAuthClient(accessToken);
    if (userEmail && this.jwtClient) return this.getDelegatedClient(userEmail);
    throw new Error('No valid authentication provided for Google Calendar.');
  }
}

module.exports = new GoogleCalendarService();
