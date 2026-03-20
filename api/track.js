'use strict';

const mongoose = require('mongoose');
const PageView = require('../src/page-view.model');

let conn = null;

module.exports = async function trackHandler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, error: 'Method Not Allowed' });
  }

  if (!process.env.MONGODB_CONNECTION_STRING) {
    return res.status(500).json({ ok: false, error: 'Missing MONGODB_CONNECTION_STRING' });
  }

  const payload = normalizePayload(req.body);

  if (!payload.pageViewId || !payload.path) {
    return res.status(400).json({ ok: false, error: 'Missing required tracking fields' });
  }

  const requestMeta = getRequestMeta(req.headers);
  const now = new Date();

  await ensureConnection();

  await PageView.findOneAndUpdate(
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

  return res.status(202).json({ ok: true, pageViewId: payload.pageViewId, receivedAt: now.toISOString() });
};

async function ensureConnection() {
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  if (conn == null) {
    conn = mongoose.connect(process.env.MONGODB_CONNECTION_STRING, { serverSelectionTimeoutMS: 3000 });
  }

  return conn;
}

function getRequestMeta(headers) {
  const forwardedFor = headers['x-forwarded-for'];
  const ipAddress = Array.isArray(forwardedFor)
    ? forwardedFor[0]
    : (forwardedFor || '').split(',')[0].trim() || null;

  return {
    ipAddress,
    userAgent: headers['user-agent'] || null,
    origin: headers.origin || null
  };
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
