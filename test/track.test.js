'use strict';

const assert = require('assert');
const mongoose = require('mongoose');

const trackHandler = require('../api/track');

describe('api/track', function() {
  const originalCreateConnection = mongoose.createConnection;
  const originalConnect = mongoose.connect;
  const originalTrackUri = process.env.TRACK_MONGODB_CONNECTION_STRING;

  afterEach(function() {
    mongoose.createConnection = originalCreateConnection;
    mongoose.connect = originalConnect;
    process.env.TRACK_MONGODB_CONNECTION_STRING = originalTrackUri;
    trackHandler._test.resetState();
  });

  it('returns 500 when TRACK_MONGODB_CONNECTION_STRING is missing', async function() {
    delete process.env.TRACK_MONGODB_CONNECTION_STRING;

    const res = createResponse();

    await trackHandler({
      method: 'POST',
      headers: {},
      body: { pageViewId: 'pv_1', path: '/' }
    }, res);

    assert.equal(res.statusCode, 500);
    assert.deepEqual(res.body, {
      ok: false,
      error: 'Missing TRACK_MONGODB_CONNECTION_STRING'
    });
  });

  it('normalizes payload strings and request geo metadata', function() {
    assert.deepEqual(trackHandler._test.normalizePayload('{"path":"/docs"}'), { path: '/docs' });
    assert.deepEqual(trackHandler._test.normalizePayload('{'), {});

    const requestMeta = trackHandler._test.getRequestMeta({
      headers: {
        'x-forwarded-for': '203.0.113.10, 10.0.0.1',
        'user-agent': 'Mozilla/5.0',
        origin: 'https://studio.mongoosejs.io',
        'x-vercel-ip-city': 'New York',
        'x-vercel-ip-country': 'US',
        'x-vercel-ip-country-region': 'NY',
        'x-vercel-ip-latitude': '40.7128',
        'x-vercel-ip-longitude': '-74.0060',
        'x-vercel-ip-timezone': 'America/New_York'
      },
      geo: {
        region: 'iad1'
      }
    });

    assert.deepEqual(requestMeta, {
      ipAddress: '203.0.113.10',
      userAgent: 'Mozilla/5.0',
      origin: 'https://studio.mongoosejs.io',
      ipGeolocation: {
        city: 'New York',
        country: 'US',
        countryRegion: 'NY',
        region: 'iad1',
        latitude: '40.7128',
        longitude: '-74.0060',
        timezone: 'America/New_York'
      }
    });
  });

  it('uses a dedicated createConnection and caches it across requests', async function() {
    process.env.TRACK_MONGODB_CONNECTION_STRING = 'mongodb://127.0.0.1:27017/track_test';

    let createConnectionCalls = 0;
    const updates = [];
    const connection = {
      readyState: 1,
      models: {},
      model(name, schema) {
        assert.equal(name, 'PageView');
        assert.ok(schema);
        const model = {
          findOneAndUpdate: async function(filter, update, options) {
            updates.push({ filter, update, options });
          }
        };
        this.models[name] = model;
        return model;
      },
      asPromise() {
        return Promise.resolve(this);
      }
    };

    mongoose.connect = function() {
      throw new Error('track should not call mongoose.connect()');
    };
    mongoose.createConnection = function(uri, options) {
      createConnectionCalls += 1;
      assert.equal(uri, process.env.TRACK_MONGODB_CONNECTION_STRING);
      assert.deepEqual(options, { serverSelectionTimeoutMS: 3000 });
      return connection;
    };

    const req = {
      method: 'POST',
      headers: {
        'x-forwarded-for': '198.51.100.7, 10.0.0.1',
        'user-agent': 'Track Test',
        origin: 'https://studio.mongoosejs.io',
        'x-vercel-ip-city': 'Atlanta',
        'x-vercel-ip-country': 'US',
        'x-vercel-ip-country-region': 'GA',
        'x-vercel-ip-latitude': '33.7490',
        'x-vercel-ip-longitude': '-84.3880',
        'x-vercel-ip-timezone': 'America/New_York'
      },
      geo: {
        region: 'iad1'
      },
      body: {
        pageViewId: 'pv_track_1',
        sessionId: 'session_1',
        path: '/docs/track',
        pageType: 'docs',
        elapsedMs: 321,
        maxScrollDepthPercent: 92,
        viewport: { width: 1440, height: 900 }
      }
    };

    const res1 = createResponse();
    await trackHandler(req, res1);

    const res2 = createResponse();
    await trackHandler({
      ...req,
      body: {
        ...req.body,
        pageViewId: 'pv_track_2',
        sequence: 2
      }
    }, res2);

    assert.equal(createConnectionCalls, 1);
    assert.equal(res1.statusCode, 202);
    assert.equal(res2.statusCode, 202);
    assert.equal(updates.length, 2);
    assert.deepEqual(updates[0].filter, { pageViewId: 'pv_track_1' });
    assert.equal(updates[0].update.$set.requestMeta.ipAddress, '198.51.100.7');
    assert.deepEqual(updates[0].update.$set.requestMeta.ipGeolocation, {
      city: 'Atlanta',
      country: 'US',
      countryRegion: 'GA',
      region: 'iad1',
      latitude: '33.7490',
      longitude: '-84.3880',
      timezone: 'America/New_York'
    });
    assert.equal(updates[0].options.upsert, true);
    assert.equal(updates[0].options.new, true);
    assert.equal(updates[0].options.setDefaultsOnInsert, true);
  });
});

function createResponse() {
  return {
    headers: {},
    statusCode: 200,
    body: null,
    setHeader(key, value) {
      this.headers[key] = value;
    },
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    }
  };
}
