require('dotenv').config();
const googleAuthService = require('./services/googleAuthService');

console.log('DISABLE_SECURITY_CHALLENGE:', process.env.DISABLE_SECURITY_CHALLENGE);
console.log('DISABLE_SECURITY_CHALLENGE type:', typeof process.env.DISABLE_SECURITY_CHALLENGE);
console.log('isConfigured():', googleAuthService.isConfigured());
console.log('GOOGLE_SERVICE_ACCOUNT_EMAIL:', process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL);
console.log('EMAIL_USER:', process.env.EMAIL_USER);
