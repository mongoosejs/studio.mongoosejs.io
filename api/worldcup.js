'use strict';

const mongoose = require('mongoose');

require('../src/worldcup-demo/worldCup.model');

const studio = require('@mongoosejs/studio/backend/next');

const handler = studio(mongoose, {
  apiKey: process.env.MONGOOSE_STUDIO_API_KEY,
  googleGeminiAPIKey: process.env.GEMINI_API_KEY,
  model: 'gemini-3.1-pro-preview'
});

let conn = null;

async function handlerWrapper(req, res) {
  if (conn == null) {
    conn = await mongoose.connect(process.env.MONGODB_CONNECTION_STRING, { serverSelectionTimeoutMS: 3000 });
  }

  await handler.apply(null, [req, res]).catch(err => {
    console.log(err);
    throw err;
  });
}

module.exports = handlerWrapper;
