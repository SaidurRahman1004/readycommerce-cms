const mongoose = require('mongoose');

const connectDB = async () => {
  const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/readycommerce';

  mongoose.set('strictQuery', true);
  mongoose.connection.on('error', (error) => {
    console.error(`MongoDB error: ${error.message}`);
  });

  const conn = await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 5000 });
  console.log(`MongoDB Connected: ${conn.connection.host}`);
  return conn;
};

module.exports = connectDB;
