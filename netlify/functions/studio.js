'use strict';

const mongoose = require('mongoose');

require('../../src/movies-demo/movies.model');

const handler = require('@mongoosejs/studio/backend/netlify')(mongoose.connection, {
  apiKey: process.env.MONGOOSE_STUDIO_API_KEY
}).handler;

let conn = null;

module.exports = {
  handler: async function studioHandler(params) {
    if (conn == null) {
      conn = await mongoose.connect(process.env.MONGODB_CONNECTION_STRING, { serverSelectionTimeoutMS: 3000 });
    }

    return handler.apply(null, arguments);
  }
};
