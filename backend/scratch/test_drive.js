require('dotenv').config();
const { google } = require('googleapis');

async function testDriveSync() {
  const email = (process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || '').trim().replace(/^["']|["']$/g, '');
  let privateKey = (process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY || '').trim().replace(/^["']|["']$/g, '');
  
  if (privateKey) {
    privateKey = privateKey.replace(/\\n/g, '\n');
  }

  // Super robust cleaning
  let cleanKey = privateKey.replace(/^["']|["']$/g, ''); // Remove outer quotes
  cleanKey = cleanKey.replace(/\\n/g, '\n');             // Convert escaped newlines
  
  // If it's already got the header and footer, let's try to normalize it
  const header = '-----BEGIN PRIVATE KEY-----';
  const footer = '-----END PRIVATE KEY-----';
  
  if (cleanKey.includes(header) && cleanKey.includes(footer)) {
    let body = cleanKey.split(header)[1].split(footer)[0].replace(/\s/g, '');
    // Wrap body at 64 chars (standard PEM)
    const wrappedBody = body.match(/.{1,64}/g).join('\n');
    cleanKey = `${header}\n${wrappedBody}\n${footer}\n`;
  }
  
  console.log('--- Config ---');
  console.log('Email:', email);
  console.log('Cleaned Key Length:', cleanKey.length);
  console.log('Private Key End:', privateKey.substring(privateKey.length - 30));
  
  const folderId = '1DCqhNlTlPesBGyde-jIKcEJiFWBjKG6'; // From user screenshot
  
  const auth = google.auth.fromJSON({
    client_email: email,
    private_key: cleanKey
  });
  auth.scopes = ['https://www.googleapis.com/auth/drive.readonly'];

  const drive = google.drive({ version: 'v3', auth });

  try {
    console.log('\n--- Attempting List ---');
    const res = await drive.files.list({
      // auth, // Try with and without
      q: `'${folderId}' in parents and trashed = false`,
      fields: 'files(id, name)',
      pageSize: 5
    });
    console.log('Success! Found:', res.data.files.length, 'files');
    console.log(JSON.stringify(res.data.files, null, 2));
  } catch (err) {
    console.error('\n--- FAILED ---');
    if (err.response) {
      console.error('Status:', err.response.status);
      console.error('Data:', JSON.stringify(err.response.data, null, 2));
    } else {
      console.error('Message:', err.message);
    }
    
    console.log('\n--- Retrying with explicit authorize() ---');
    try {
      await auth.authorize();
      const res2 = await drive.files.list({
        q: `'${folderId}' in parents and trashed = false`,
        fields: 'files(id, name)',
        pageSize: 5
      });
      console.log('Success with explicit authorize()!');
    } catch (err2) {
      console.error('Still failed:', err2.message);
    }
  }
}

testDriveSync();
