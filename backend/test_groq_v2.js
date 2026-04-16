const axios = require('axios');
require('dotenv').config({ path: './backend/.env' });

async function test() {
  try {
    const res = await axios.post(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: 'hi' }],
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );
    console.log('SUCCESS:', res.data.choices[0].message.content);
  } catch (err) {
    console.error('ERROR Status:', err.response?.status);
    console.error('ERROR Data:', JSON.stringify(err.response?.data, null, 2));
  }
}

test();
