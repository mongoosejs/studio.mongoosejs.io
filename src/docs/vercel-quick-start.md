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

Create a serverless API route at `pages/api/studio.js` to host the Mongoose Studio API.
Use `pages/api/studio.js` even if the rest of your app uses the Next.js App Router.
The Studio backend is a Pages Router style `(req, res)` handler, so it is not directly compatible with App Router route handlers (`app/api/studio/route.js`), which use the `NextRequest`/`NextResponse` API instead.
Pages Router API routes work alongside the App Router in the same Next.js project, and the route is still served at `/api/studio`.
If your project keeps source files under `src/`, create the route at `src/pages/api/studio.js` instead.
Make sure to import your existing database connection so Studio uses the same Mongoose models your app does.
Importing your app's models module here also ensures the models are registered on the connection before Studio handles its first request.

```javascript
// Import your existing database connection
import db from '../../src/db';
import { vercelAPIRouteHandler } from '@mongoosejs/studio/vercel';

export default vercelAPIRouteHandler(
  db, // Mongoose connection or Mongoose global. Pass null to use `import mongoose`.
  {
    apiKey: process.env.MONGOOSE_STUDIO_API_KEY // optional, for Mongoose Studio Pro
  }
);
```

The `/vercel` entry point is fully typed, so TypeScript projects need no suppressions.

### Configuration

If you have a Mongoose Studio Pro API key or want to use advanced features like providing your own OpenAI, Anthropic, or Google Gemini key, pass them in the options object:

```javascript
export default vercelAPIRouteHandler(db, {
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
