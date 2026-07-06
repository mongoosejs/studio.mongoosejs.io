---
title: Vercel Quick Start Guide
description: Power up your Vercel-hosted app with a full-featured MongoDB GUI in just a few lines with Mongoose Studio.
---

# Quick Start Guide

Welcome to **Mongoose Studio**!
This guide will help you get up and running with Mongoose Studio on **Vercel**.

These instructions cover deploying Mongoose Studio on Vercel.
They are **not** Next.js-specific — the same setup works for any Vercel-hosted app that exposes a serverless API route.
Next.js is the most common host for these instructions, but the integration is with Vercel's serverless runtime, not with Next.js itself.

---

## 1. Install the Package

Begin by installing the Mongoose Studio NPM package:

```bash
npm install @mongoosejs/studio
```

---

## 2. Mount the Studio Frontend

Add `withMongooseStudio` to your `next.config.js` (or equivalent Vercel build config) to serve the Mongoose Studio frontend at `/studio`:

```javascript
import withMongooseStudio from '@mongoosejs/studio/next';

// Mount Mongoose Studio frontend on /studio
export default withMongooseStudio({
  // Your existing config here
  reactStrictMode: true,
});
```

---

## 3. Add the Studio API Route

Create a serverless API route at `pages/api/studio.js` (or `app/api/studio/route.js` for the App Router) to host the Mongoose Studio API.
Make sure to import your existing database connection so Studio uses the same Mongoose models your app does.

```javascript
// Import your existing database connection
import db from '../../src/db';
import studio from '@mongoosejs/studio/backend/vercel';

const handler = studio(
  db, // Mongoose connection or Mongoose global. Pass null to use `import mongoose`.
  {
    apiKey: process.env.MONGOOSE_STUDIO_API_KEY, // optional, for Mongoose Studio Pro
    connection: db, // optional: Connection or Mongoose global. If omitted, falls back to `import mongoose`.
    connectToDB: async () => { /* connection logic here */ } // optional: called before each request if you need to (re)connect
  }
);

export default handler;
```

The `connectToDB` hook is particularly useful on Vercel, where serverless functions can run on cold instances that need to re-establish the Mongoose connection.

### Configuration

If you have a Mongoose Studio Pro API key or want to use advanced features like providing your own OpenAI, Anthropic, or Google Gemini key, pass them in the options object:

```javascript
const handler = studio(db, {
  apiKey: process.env.MONGOOSE_STUDIO_API_KEY, // optional for Pro
  model: 'gpt-4o-mini',                        // optional ChatGPT model
  openAIAPIKey: process.env.OPENAI_API_KEY,    // optional for chat with your own OpenAI key
  anthropicAPIKey: process.env.ANTHROPIC_API_KEY,
  googleGeminiAPIKey: process.env.GOOGLE_GEMINI_API_KEY
});
```

---

## 4. Accessing Mongoose Studio

- In **local development**, visit `http://localhost:3000/studio`.
- In **production**, Studio will be at `your-app.vercel.app/studio` (or your custom domain).

---

## 5. Next Steps

- **Auth:** By default, authentication is not enabled and Mongoose Studio only accepts localhost connections without an API key. For production access and role management, check out [Mongoose Studio Pro](https://studio.mongoosejs.io/#pricing).
- **Demo:** Test drive with the [IMDB demo](https://studio.mongoosejs.io/imdb/#/) or the [World Cup demo](https://studio.mongoosejs.io/worldcup/#/).
- **Source:** Check out the [GitHub repo](https://github.com/mongoosejs/studio) for examples and advanced setup.
- **Request a Feature (or Report a Bug):** Open an issue on [GitHub Issues](https://github.com/mongoosejs/studio/issues).
- **Get Help:** Join our [Discord server](https://discord.gg/P3YCfKYxpy) or open an issue on [GitHub Issues](https://github.com/mongoosejs/studio/issues).

---

**That's it!** You can now manage your MongoDB data visually alongside your Vercel-hosted app.
