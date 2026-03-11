'use strict';

// Mock API interceptor for the non-interactive demo embed.
// This script must load AFTER axios (via app.js webpack bundle) but we
// monkey-patch XMLHttpRequest so it's in place before any requests fire.

(function () {
  var objectId = (function () {
    var counter = 0;
    return function () {
      var ts = Math.floor(Date.now() / 1000).toString(16).padStart(8, '0');
      var rand = Math.random().toString(16).slice(2, 18).padStart(10, '0');
      var cnt = (counter++).toString(16).padStart(6, '0');
      return (ts + rand + cnt).slice(0, 24);
    };
  })();

  // Pre-generate stable IDs
  var userIds = Array.from({ length: 8 }, objectId);
  var projectIds = Array.from({ length: 5 }, objectId);
  var taskIds = Array.from({ length: 12 }, objectId);

  var now = new Date();
  function daysAgo(n) { return new Date(now - n * 86400000).toISOString(); }

  // ---- Stub documents ----

  var users = [
    { _id: userIds[0], name: 'Alice Chen', email: 'alice@acme.io', role: 'admin', avatar: '', createdAt: daysAgo(120), updatedAt: daysAgo(2) },
    { _id: userIds[1], name: 'Bob Martinez', email: 'bob@acme.io', role: 'member', avatar: '', createdAt: daysAgo(98), updatedAt: daysAgo(5) },
    { _id: userIds[2], name: 'Carol Wu', email: 'carol@acme.io', role: 'member', avatar: '', createdAt: daysAgo(87), updatedAt: daysAgo(1) },
    { _id: userIds[3], name: 'Dan Okafor', email: 'dan@acme.io', role: 'admin', avatar: '', createdAt: daysAgo(75), updatedAt: daysAgo(10) },
    { _id: userIds[4], name: 'Eva Johansson', email: 'eva@acme.io', role: 'viewer', avatar: '', createdAt: daysAgo(60), updatedAt: daysAgo(3) },
    { _id: userIds[5], name: 'Frank Dubois', email: 'frank@acme.io', role: 'member', avatar: '', createdAt: daysAgo(45), updatedAt: daysAgo(7) },
    { _id: userIds[6], name: 'Grace Kim', email: 'grace@acme.io', role: 'member', avatar: '', createdAt: daysAgo(30), updatedAt: daysAgo(0) },
    { _id: userIds[7], name: 'Hiro Tanaka', email: 'hiro@acme.io', role: 'viewer', avatar: '', createdAt: daysAgo(15), updatedAt: daysAgo(1) }
  ];

  var projects = [
    { _id: projectIds[0], name: 'Website Redesign', description: 'Overhaul the marketing site with new brand guidelines', owner: userIds[0], status: 'active', createdAt: daysAgo(90), updatedAt: daysAgo(1) },
    { _id: projectIds[1], name: 'Mobile App v2', description: 'React Native rewrite of the mobile application', owner: userIds[1], status: 'active', createdAt: daysAgo(60), updatedAt: daysAgo(2) },
    { _id: projectIds[2], name: 'API Migration', description: 'Migrate REST API to GraphQL', owner: userIds[3], status: 'planning', createdAt: daysAgo(30), updatedAt: daysAgo(5) },
    { _id: projectIds[3], name: 'Analytics Dashboard', description: 'Internal metrics and KPI dashboard', owner: userIds[0], status: 'completed', createdAt: daysAgo(150), updatedAt: daysAgo(20) },
    { _id: projectIds[4], name: 'CI/CD Pipeline', description: 'Automate build, test, and deployment pipeline', owner: userIds[3], status: 'active', createdAt: daysAgo(45), updatedAt: daysAgo(3) }
  ];

  var statuses = ['todo', 'in_progress', 'in_review', 'done'];
  var priorities = ['low', 'medium', 'high', 'critical'];
  var tasks = [
    { _id: taskIds[0], title: 'Design homepage mockups', project: projectIds[0], assignee: userIds[2], status: 'done', priority: 'high', dueDate: daysAgo(-5), createdAt: daysAgo(80), updatedAt: daysAgo(3) },
    { _id: taskIds[1], title: 'Implement auth flow', project: projectIds[1], assignee: userIds[1], status: 'in_progress', priority: 'critical', dueDate: daysAgo(-2), createdAt: daysAgo(50), updatedAt: daysAgo(1) },
    { _id: taskIds[2], title: 'Set up GraphQL schema', project: projectIds[2], assignee: userIds[3], status: 'todo', priority: 'high', dueDate: daysAgo(-14), createdAt: daysAgo(25), updatedAt: daysAgo(5) },
    { _id: taskIds[3], title: 'Write unit tests for User model', project: projectIds[1], assignee: userIds[5], status: 'in_review', priority: 'medium', dueDate: daysAgo(-7), createdAt: daysAgo(40), updatedAt: daysAgo(2) },
    { _id: taskIds[4], title: 'Configure CI runners', project: projectIds[4], assignee: userIds[3], status: 'in_progress', priority: 'high', dueDate: daysAgo(-10), createdAt: daysAgo(30), updatedAt: daysAgo(1) },
    { _id: taskIds[5], title: 'SEO audit', project: projectIds[0], assignee: userIds[4], status: 'todo', priority: 'low', dueDate: daysAgo(-20), createdAt: daysAgo(70), updatedAt: daysAgo(10) },
    { _id: taskIds[6], title: 'Push notification service', project: projectIds[1], assignee: userIds[6], status: 'todo', priority: 'medium', dueDate: daysAgo(-30), createdAt: daysAgo(35), updatedAt: daysAgo(8) },
    { _id: taskIds[7], title: 'Create deployment scripts', project: projectIds[4], assignee: userIds[1], status: 'done', priority: 'high', dueDate: daysAgo(5), createdAt: daysAgo(40), updatedAt: daysAgo(6) },
    { _id: taskIds[8], title: 'Performance benchmarks', project: projectIds[2], assignee: userIds[5], status: 'todo', priority: 'medium', dueDate: daysAgo(-25), createdAt: daysAgo(20), updatedAt: daysAgo(4) },
    { _id: taskIds[9], title: 'Responsive nav component', project: projectIds[0], assignee: userIds[6], status: 'in_progress', priority: 'medium', dueDate: daysAgo(-3), createdAt: daysAgo(15), updatedAt: daysAgo(0) },
    { _id: taskIds[10], title: 'Dark mode support', project: projectIds[0], assignee: userIds[2], status: 'in_review', priority: 'low', dueDate: daysAgo(-8), createdAt: daysAgo(10), updatedAt: daysAgo(1) },
    { _id: taskIds[11], title: 'Archive completed dashboard', project: projectIds[3], assignee: userIds[0], status: 'done', priority: 'low', dueDate: daysAgo(15), createdAt: daysAgo(25), updatedAt: daysAgo(20) }
  ];

  // ---- Schema paths ----

  var userSchemaPaths = {
    _id: { instance: 'ObjectId', path: '_id', ref: null },
    name: { instance: 'String', path: 'name', ref: null, required: true },
    email: { instance: 'String', path: 'email', ref: null, required: true },
    role: { instance: 'String', path: 'role', ref: null, enum: ['admin', 'member', 'viewer'] },
    avatar: { instance: 'String', path: 'avatar', ref: null },
    createdAt: { instance: 'Date', path: 'createdAt', ref: null },
    updatedAt: { instance: 'Date', path: 'updatedAt', ref: null }
  };

  var projectSchemaPaths = {
    _id: { instance: 'ObjectId', path: '_id', ref: null },
    name: { instance: 'String', path: 'name', ref: null, required: true },
    description: { instance: 'String', path: 'description', ref: null },
    owner: { instance: 'ObjectId', path: 'owner', ref: 'User' },
    status: { instance: 'String', path: 'status', ref: null, enum: ['planning', 'active', 'completed', 'archived'] },
    createdAt: { instance: 'Date', path: 'createdAt', ref: null },
    updatedAt: { instance: 'Date', path: 'updatedAt', ref: null }
  };

  var taskSchemaPaths = {
    _id: { instance: 'ObjectId', path: '_id', ref: null },
    title: { instance: 'String', path: 'title', ref: null, required: true },
    project: { instance: 'ObjectId', path: 'project', ref: 'Project' },
    assignee: { instance: 'ObjectId', path: 'assignee', ref: 'User' },
    status: { instance: 'String', path: 'status', ref: null, enum: ['todo', 'in_progress', 'in_review', 'done'] },
    priority: { instance: 'String', path: 'priority', ref: null, enum: ['low', 'medium', 'high', 'critical'] },
    dueDate: { instance: 'Date', path: 'dueDate', ref: null },
    createdAt: { instance: 'Date', path: 'createdAt', ref: null },
    updatedAt: { instance: 'Date', path: 'updatedAt', ref: null }
  };

  var modelSchemaPaths = {
    User: userSchemaPaths,
    Project: projectSchemaPaths,
    Task: taskSchemaPaths
  };

  var docsByModel = {
    User: users,
    Project: projects,
    Task: tasks
  };

  // ---- Action handlers ----

  var handlers = {
    'status': function () {
      return { nodeEnv: 'production' };
    },
    'Model.listModels': function () {
      return {
        models: ['Project', 'Task', 'User'],
        modelSchemaPaths: modelSchemaPaths,
        readyState: 1
      };
    },
    'Model.getEstimatedDocumentCounts': function () {
      return {
        counts: {
          User: users.length,
          Project: projects.length,
          Task: tasks.length
        }
      };
    },
    'Model.getDocuments': function (params) {
      var model = params.model;
      var docs = docsByModel[model] || [];
      return {
        docs: docs,
        schemaPaths: modelSchemaPaths[model] || {},
        numDocs: docs.length
      };
    },
    'Model.getDocument': function (params) {
      var model = params.model;
      var docs = docsByModel[model] || [];
      var doc = docs.find(function (d) { return d._id === params.documentId; }) || docs[0] || {};
      return {
        doc: doc,
        schemaPaths: modelSchemaPaths[model] || {}
      };
    },
    'Model.getCollectionInfo': function (params) {
      return { stats: { count: (docsByModel[params.model] || []).length, size: 4096, avgObjSize: 256 } };
    },
    'Model.getIndexes': function () {
      return { indexes: [{ v: 2, key: { _id: 1 }, name: '_id_' }] };
    },
    'Dashboard.getDashboards': function () {
      return { dashboards: [] };
    },
    'ChatThread.listChatThreads': function () {
      return { chatThreads: [] };
    },
    'Task.getTasks': function () {
      return { tasks: [] };
    }
  };

  // ---- XMLHttpRequest monkey-patch ----

  var OrigXHR = window.XMLHttpRequest;
  var baseURL = window.MONGOOSE_STUDIO_CONFIG.baseURL;

  function MockXHR() {
    this._headers = {};
    this._method = null;
    this._url = null;
    this._async = true;
    this._listeners = {};
    this.readyState = 0;
    this.status = 0;
    this.statusText = '';
    this.responseText = '';
    this.response = '';
    this.responseType = '';
    this.onreadystatechange = null;
    this.onload = null;
    this.onerror = null;
  }

  MockXHR.prototype.open = function (method, url, async) {
    this._method = method;
    this._url = url;
    this._async = async !== false;
    this.readyState = 1;
  };

  MockXHR.prototype.setRequestHeader = function (key, value) {
    this._headers[key.toLowerCase()] = value;
  };

  MockXHR.prototype.addEventListener = function (type, fn) {
    if (!this._listeners[type]) this._listeners[type] = [];
    this._listeners[type].push(fn);
  };

  MockXHR.prototype.removeEventListener = function (type, fn) {
    if (!this._listeners[type]) return;
    this._listeners[type] = this._listeners[type].filter(function (f) { return f !== fn; });
  };

  MockXHR.prototype._emit = function (type) {
    var cbs = this._listeners[type] || [];
    for (var i = 0; i < cbs.length; i++) cbs[i].call(this, { target: this });
  };

  MockXHR.prototype.send = function (body) {
    var self = this;
    var params = {};
    try { params = JSON.parse(body); } catch (e) { /* ignore */ }

    var action = params.action || '';

    // For non-lambda style: extract action from URL path
    if (!action && self._url) {
      var urlPath = self._url.replace(baseURL, '');
      // e.g. /Model/listModels -> Model.listModels
      if (urlPath.startsWith('/')) urlPath = urlPath.slice(1);
      action = urlPath.replace(/\//g, '.');
    }

    var handler = handlers[action];
    var responseData;
    if (handler) {
      responseData = handler(params);
    } else {
      responseData = { ok: true };
    }

    var json = JSON.stringify(responseData);

    setTimeout(function () {
      self.readyState = 4;
      self.status = 200;
      self.statusText = 'OK';
      self.responseText = json;
      self.response = json;
      if (self.onreadystatechange) self.onreadystatechange();
      if (self.onload) self.onload();
      self._emit('readystatechange');
      self._emit('load');
      self._emit('loadend');
    }, 30);
  };

  MockXHR.prototype.abort = function () {};
  MockXHR.prototype.getAllResponseHeaders = function () {
    return 'content-type: application/json\r\n';
  };
  MockXHR.prototype.getResponseHeader = function (name) {
    if (name.toLowerCase() === 'content-type') return 'application/json';
    return null;
  };

  window.XMLHttpRequest = MockXHR;

  // Also stub fetch for SSE streams (getDocumentsStream, streamChatMessage, etc.)
  var origFetch = window.fetch;
  window.fetch = function (url, opts) {
    if (typeof url === 'string' && url.indexOf(baseURL) === 0) {
      // Parse action from URL
      var path = url.replace(baseURL, '').split('?')[0];
      if (path.startsWith('/')) path = path.slice(1);
      var action = path.replace(/\//g, '.');

      // Parse query params
      var qIdx = url.indexOf('?');
      var qParams = {};
      if (qIdx !== -1) {
        new URLSearchParams(url.slice(qIdx + 1)).forEach(function (v, k) { qParams[k] = v; });
      }

      // Handle getDocumentsStream as SSE
      if (action === 'Model.getDocumentsStream') {
        var model = qParams.model;
        var docs = docsByModel[model] || [];
        var sp = modelSchemaPaths[model] || {};
        var events = [];
        events.push('data: ' + JSON.stringify({ schemaPaths: sp }) + '\n\n');
        for (var i = 0; i < docs.length; i++) {
          events.push('data: ' + JSON.stringify({ document: docs[i] }) + '\n\n');
        }
        events.push('data: ' + JSON.stringify({ numDocs: docs.length }) + '\n\n');
        var sseBody = events.join('');

        return Promise.resolve(new Response(sseBody, {
          status: 200,
          headers: { 'Content-Type': 'text/event-stream' }
        }));
      }

      // For other fetch-based calls, return mock response
      var handler = handlers[action];
      if (handler) {
        return Promise.resolve(new Response(JSON.stringify(handler(qParams)), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        }));
      }

      return Promise.resolve(new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }));
    }
    return origFetch.apply(this, arguments);
  };
})();
