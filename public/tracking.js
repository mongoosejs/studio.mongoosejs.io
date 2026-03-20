(function() {
  const TRACK_ENDPOINT = '/api/track';
  const SESSION_STORAGE_KEY = 'mongooseStudioTrackerSessionId';
  const PAGE_VIEW_ID = generateId();
  const PAGE_START = Date.now();
  const CUSTOM_EVENTS = [];
  const ONCE_KEYS = new Set();
  const URL_PARAMS = new URLSearchParams(window.location.search);
  const UTM = {};
  const TRACKED_UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'utm_id'];
  let sequence = 0;
  let maxScrollDepth = 0;
  let latestReason = 'init';
  let lastFlushAt = 0;
  let flushTimer = null;
  let config = { pageType: 'page', attach: null };

  for (const key of TRACKED_UTM_KEYS) {
    const value = URL_PARAMS.get(key);
    if (value) {
      UTM[key] = value;
    }
  }

  const sessionId = getOrCreateSessionId();

  function getOrCreateSessionId() {
    try {
      const existing = window.sessionStorage.getItem(SESSION_STORAGE_KEY);
      if (existing) {
        return existing;
      }
      const created = generateId();
      window.sessionStorage.setItem(SESSION_STORAGE_KEY, created);
      return created;
    } catch (err) {
      return generateId();
    }
  }

  function generateId() {
    if (window.crypto && window.crypto.randomUUID) {
      return window.crypto.randomUUID();
    }

    return `pv_${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`;
  }

  function getScrollDepth() {
    const root = document.documentElement;
    const body = document.body;
    const scrollTop = window.scrollY || root.scrollTop || body.scrollTop || 0;
    const viewportHeight = window.innerHeight || root.clientHeight || 0;
    const scrollHeight = Math.max(
      body.scrollHeight,
      root.scrollHeight,
      body.offsetHeight,
      root.offsetHeight,
      body.clientHeight,
      root.clientHeight
    );

    if (scrollHeight <= viewportHeight) {
      return 100;
    }

    return Math.min(100, Math.round(((scrollTop + viewportHeight) / scrollHeight) * 100));
  }

  function updateScrollDepth() {
    maxScrollDepth = Math.max(maxScrollDepth, getScrollDepth());
  }

  function trackCustomEvent(name, properties = {}, options = {}) {
    const onceKey = options.onceKey || null;
    if (onceKey && ONCE_KEYS.has(onceKey)) {
      return false;
    }
    if (onceKey) {
      ONCE_KEYS.add(onceKey);
    }

    updateScrollDepth();
    CUSTOM_EVENTS.push({
      name,
      properties,
      atMs: Date.now() - PAGE_START
    });

    queueFlush('custom_event', 800);
    return true;
  }

  function buildPayload(reason, isFinal = false) {
    updateScrollDepth();

    return {
      eventType: 'page_view',
      pageViewId: PAGE_VIEW_ID,
      sessionId,
      pageType: config.pageType,
      path: window.location.pathname,
      search: window.location.search,
      url: window.location.href,
      title: document.title,
      referrer: document.referrer || null,
      elapsedMs: Date.now() - PAGE_START,
      maxScrollDepthPercent: maxScrollDepth,
      utm: UTM,
      gclid: URL_PARAMS.get('gclid'),
      customEvents: CUSTOM_EVENTS,
      sequence: ++sequence,
      reason,
      isFinal,
      visibilityState: document.visibilityState,
      viewport: {
        width: window.innerWidth || null,
        height: window.innerHeight || null
      },
      timestamp: new Date().toISOString()
    };
  }

  function sendPayload(payload, useBeacon) {
    const body = JSON.stringify(payload);

    if (useBeacon && navigator.sendBeacon) {
      return navigator.sendBeacon(TRACK_ENDPOINT, new Blob([body], { type: 'application/json' }));
    }

    return fetch(TRACK_ENDPOINT, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body,
      keepalive: useBeacon,
      credentials: 'same-origin'
    }).catch(() => undefined);
  }

  function flush(options = {}) {
    const reason = options.reason || latestReason || 'interval';
    const isFinal = options.isFinal === true;
    latestReason = reason;
    lastFlushAt = Date.now();
    return sendPayload(buildPayload(reason, isFinal), isFinal);
  }

  function queueFlush(reason, delay = 15000) {
    latestReason = reason;
    if (flushTimer) {
      return;
    }
    flushTimer = window.setTimeout(() => {
      flushTimer = null;
      flush({ reason });
    }, delay);
  }

  function configure(nextConfig) {
    config = { ...config, ...(nextConfig || {}) };
    if (typeof config.attach === 'function') {
      config.attach(publicApi);
      config.attach = null;
    }
  }

  updateScrollDepth();
  window.addEventListener('scroll', () => {
    updateScrollDepth();
    queueFlush('scroll');
  }, { passive: true });
  window.addEventListener('beforeunload', () => flush({ reason: 'beforeunload', isFinal: true }));
  window.addEventListener('pagehide', () => flush({ reason: 'pagehide', isFinal: true }));
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      flush({ reason: 'visibility_hidden', isFinal: true });
      return;
    }
    queueFlush('visibility_visible', 1000);
  });

  window.setInterval(() => {
    if (Date.now() - lastFlushAt >= 14000) {
      flush({ reason: 'heartbeat' });
    }
  }, 15000);

  const publicApi = {
    configure,
    flush,
    trackCustomEvent,
    getMaxScrollDepth: () => maxScrollDepth,
    getPageViewId: () => PAGE_VIEW_ID
  };

  window.mongooseStudioTracker = publicApi;
  queueFlush('page_load', 1200);
})();
