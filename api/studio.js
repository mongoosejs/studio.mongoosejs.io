'use strict';

const mongoose = require('mongoose');

require('../src/movies-demo/movies.model');

const studio = require('@mongoosejs/studio/backend/next');

const handler = studio({
  apiKey: process.env.MONGOOSE_STUDIO_API_KEY
});

let conn = null;

async function handlerWrapper(...args) {
  if (conn == null) {
    conn = await mongoose.connect(process.env.MONGODB_CONNECTION_STRING, { serverSelectionTimeoutMS: 3000 });
  }

  return handler.apply(null, args);
}

module.exports = handlerWrapper;
