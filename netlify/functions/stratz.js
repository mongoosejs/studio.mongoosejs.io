'use strict';

const mongoose = require('mongoose');
const { register } = require('../../src/stratz-demo/heroMetaTrend.model');

const stratzMongoose = new mongoose.Mongoose();
register(stratzMongoose);

const handler = require('@mongoosejs/studio/backend/netlify')(stratzMongoose.connection, {
  apiKey: process.env.MONGOOSE_STUDIO_API_KEY
}).handler;

let conn = null;

module.exports = {
  handler: async function stratzStudioHandler() {
    if (conn == null) {
      const uri = process.env.STRATZ_MONGODB_CONNECTION_STRING || process.env.MONGODB_CONNECTION_STRING;
      if (!uri) {
        throw new Error('Missing STRATZ_MONGODB_CONNECTION_STRING or MONGODB_CONNECTION_STRING');
      }

      conn = await stratzMongoose.connect(uri, { serverSelectionTimeoutMS: 3000 });
    }

    return handler.apply(null, arguments);
  }
};
