const mongoose = require('mongoose');
require('dotenv').config({ path: './backend/.env' });

async function checkKnowledge() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const Knowledge = mongoose.model('Knowledge', new mongoose.Schema({ title: String }));
    const docs = await Knowledge.find({});
    console.log('Knowledge Base Documents:');
    docs.forEach(doc => console.log(`- ${doc.title} (${doc._id})`));
    await mongoose.disconnect();
  } catch (err) {
    console.error(err);
  }
}

checkKnowledge();
