const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

const User = require('../models/User');

const createTestUser = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      console.error('MONGODB_URI is not defined in .env');
      process.exit(1);
    }

    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    const email = 'testuser@ask.ai';
    const password = 'password123';
    const name = 'Test User';

    let user = await User.findOne({ email });
    if (user) {
      console.log('Test user already exists. Updating status...');
      user.registrationStatus = 'approved';
      user.isVerified = true;
      user.password = await bcrypt.hash(password, 10);
      await user.save();
    } else {
      const hashedPassword = await bcrypt.hash(password, 10);
      user = new User({
        email,
        name,
        password: hashedPassword,
        isVerified: true,
        role: 'user',
        registrationStatus: 'approved'
      });
      await user.save();
      console.log('Test user created successfully');
    }

    console.log('---------------------------');
    console.log(`Email: ${email}`);
    console.log(`Password: ${password}`);
    console.log('---------------------------');

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('Error creating test user:', err);
    process.exit(1);
  }
};

createTestUser();
