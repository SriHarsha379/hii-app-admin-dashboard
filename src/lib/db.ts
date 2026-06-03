import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || '';

if (!MONGODB_URI) {
  throw new Error('MONGODB_URI environment variable is not set. Add it to your .env file.');
}

let isConnected = false;

export async function connectDB(): Promise<void> {
  if (isConnected) return;

  await mongoose.connect(MONGODB_URI, {
    dbName: 'nightlifeDB',
  });

  isConnected = true;
  console.log('Connected to MongoDB Atlas (nightlifeDB)');
}

export default mongoose;
