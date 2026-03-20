'use strict';

const mongoose = require('mongoose');
const pageViewSchema = require('../src/db/pageViewSchema');

let conn = null;
let PageView = null;

module.exports = async function trackHandler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, error: 'Method Not Allowed' });
  }

  if (!process.env.TRACK_MONGODB_CONNECTION_STRING) {
    return res.status(500).json({ ok: false, error: 'Missing TRACK_MONGODB_CONNECTION_STRING' });
  }

  const payload = normalizePayload(req.body);

  if (!payload.pageViewId || !payload.path) {
    return res.status(400).json({ ok: false, error: 'Missing required tracking fields' });
  }

  const requestMeta = getRequestMeta(req);
  const now = new Date();

  await ensureConnection();
  await upsertPageView(payload, requestMeta, now);

  return res.status(202).json({ ok: true, pageViewId: payload.pageViewId, receivedAt: now.toISOString() });
};

module.exports._test = {
  ensureConnection,
  getRequestMeta,
  normalizePayload,
  upsertPageView,
  resetState() {
    conn = null;
    PageView = null;
  }
};

async function upsertPageView(payload, requestMeta, now) {
  const pageViewModel = conn.model('PageView');

  await pageViewModel.findOneAndUpdate(
    { pageViewId: payload.pageViewId },
    {
      $set: {
        sessionId: payload.sessionId || null,
        pageType: payload.pageType || 'page',
        path: payload.path,
        search: payload.search || '',
        url: payload.url || null,
        title: payload.title || null,
        referrer: payload.referrer || null,
        elapsedMs: Number.isFinite(payload.elapsedMs) ? payload.elapsedMs : 0,
        maxScrollDepthPercent: Number.isFinite(payload.maxScrollDepthPercent) ? payload.maxScrollDepthPercent : 0,
        utm: payload.utm || {},
        gclid: payload.gclid || null,
        customEvents: Array.isArray(payload.customEvents) ? payload.customEvents : [],
        sequence: Number.isFinite(payload.sequence) ? payload.sequence : 0,
        reason: payload.reason || null,
        isFinal: payload.isFinal === true,
        visibilityState: payload.visibilityState || null,
        viewport: payload.viewport || { width: null, height: null },
        lastSeenAt: now,
        requestMeta
      },
      $setOnInsert: {
        pageViewId: payload.pageViewId,
        firstSeenAt: now
      }
    },
    {
      upsert: true,
      new: true,
      setDefaultsOnInsert: true
    }
  );
}

async function ensureConnection() {
  if (conn == null) {
    conn = mongoose.createConnection(
      process.env.TRACK_MONGODB_CONNECTION_STRING,
      { serverSelectionTimeoutMS: 3000 }
    );
    await conn.asPromise().catch(err => {
      conn = null;
      PageView = null;
      throw err;
    });

    conn.model('PageView', pageViewSchema);
  }

  return conn;
}

function getRequestMeta(req) {
  const headers = req.headers || {};
  const forwardedFor = headers['x-forwarded-for'];
  const ipAddress = Array.isArray(forwardedFor)
    ? forwardedFor[0]
    : (forwardedFor || '').split(',')[0].trim() || null;

  return {
    ipAddress,
    userAgent: headers['user-agent'] || null,
    origin: headers.origin || null,
    ipGeolocation: getIpGeolocation(req)
  };
}

function getIpGeolocation(req) {
  const headers = req.headers || {};
  const geo = req.geo || {};

  return {
    city: firstNonEmpty(geo.city, headers['x-vercel-ip-city']),
    country: firstNonEmpty(geo.country, headers['x-vercel-ip-country']),
    countryRegion: firstNonEmpty(geo.countryRegion, headers['x-vercel-ip-country-region']),
    region: firstNonEmpty(geo.region, headers['x-vercel-region']),
    latitude: firstNonEmpty(geo.latitude, headers['x-vercel-ip-latitude']),
    longitude: firstNonEmpty(geo.longitude, headers['x-vercel-ip-longitude']),
    timezone: firstNonEmpty(geo.timezone, headers['x-vercel-ip-timezone'])
  };
}

function firstNonEmpty(...values) {
  for (const value of values) {
    if (value == null) {
      continue;
    }
    if (typeof value === 'string' && value.trim() === '') {
      continue;
    }
    return value;
  }

  return null;
}

function normalizePayload(body) {
  if (body == null) {
    return {};
  }

  if (typeof body === 'string') {
    try {
      return JSON.parse(body);
    } catch (err) {
      return {};
    }
  }

  return body;
}
