require('dotenv').config();
const googleAuthService = require('../services/googleAuthService');

console.log('--- DIAGNOSTIC V2 ---');
console.log('DISABLE_SECURITY_CHALLENGE (raw):', process.env.DISABLE_SECURITY_CHALLENGE);
console.log('DISABLE_SECURITY_CHALLENGE (processed):', (process.env.DISABLE_SECURITY_CHALLENGE || '').toLowerCase().trim());
console.log('isConfigured():', googleAuthService.isConfigured());
console.log('Service Account Email:', process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL);
console.log('--- END ---');
