const mongoose = require('mongoose');
const Conversation = require('./backend/models/Conversation.js');
mongoose.connect('mongodb+srv://test:ZCLmYQLYS9OS5Jtz@cluster0.ciwifrc.mongodb.net/chatbot?retryWrites=true&w=majority&appName=Cluster0').then(async () => {
  const convs = await Conversation.find().sort({updatedAt: -1}).limit(1);
  if (convs.length > 0) {
    const msgs = convs[0].messages.slice(-4);
    console.log('Latest messages in DB:');
    msgs.forEach(m => console.log(`[${m.role}]: ${m.content}`));
  } else {
    console.log('No conversations found.');
  }
  mongoose.connection.close();
});
