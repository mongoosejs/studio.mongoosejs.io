'use strict';

const mongoose = require('mongoose');
const { register } = require('../src/stratz-demo/heroMetaTrend.model');
const studio = require('@mongoosejs/studio/backend/next');

const stratzMongoose = new mongoose.Mongoose();
register(stratzMongoose);

const handler = studio(stratzMongoose, {
  apiKey: process.env.MONGOOSE_STUDIO_API_KEY,
  googleGeminiAPIKey: process.env.GEMINI_API_KEY,
  model: 'gemini-3.1-pro-preview'
});

let conn = null;

async function handlerWrapper(req, res) {
  if (conn == null) {
    const uri = process.env.STRATZ_MONGODB_CONNECTION_STRING || process.env.MONGODB_CONNECTION_STRING;
    if (!uri) {
      throw new Error('Missing STRATZ_MONGODB_CONNECTION_STRING or MONGODB_CONNECTION_STRING');
    }

    conn = await stratzMongoose.connect(uri, { serverSelectionTimeoutMS: 3000 });
  }

  await handler.apply(null, [req, res]).catch(err => {
    console.log(err);
    throw err;
  });
}

module.exports = handlerWrapper;
