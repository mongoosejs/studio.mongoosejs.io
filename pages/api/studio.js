import mongoose from 'mongoose';

import '../../src/movies-demo/movies.model';

import studio from '@mongoosejs/studio/backend/next';

const handler = studio({
  apiKey: process.env.MONGOOSE_STUDIO_API_KEY
});

let conn = null;

async function handler(...args) {
  if (conn == null) {
    conn = await mongoose.connect(process.env.MONGODB_CONNECTION_STRING, { serverSelectionTimeoutMS: 3000 });
  }

  return handler.apply(null, args);
}

export default handler;
