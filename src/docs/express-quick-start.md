---
title: Express Quick Start Guide
description: Power up your Express app with a full-featured MongoDB GUI in just 3 lines with Mongoose Studio.
image: https://res.cloudinary.com/drfhhq8wu/image/upload/w_600,h_400,c_fill/v1762287545/studio-express_k4xrw7.png
---

# Quick Start Guide

Welcome to **Mongoose Studio**!
This guide will help you get up and running quickly with the Mongoose Studio your Express app.

---

## 1. Install the Package

Begin by installing the Mongoose Studio NPM package:

```bash
npm install @mongoosejs/studio
```

---

## 2. Mount Studio in Your Node.js Application

Integrate Mongoose Studio as middleware in your Express app.
The following will mount Mongoose Studio at `/studio`.
Remember to use `await`!

```javascript
const mongoose = require('mongoose');
const studio = require('@mongoosejs/studio/express');
// other code...

// Mount Mongoose Studio on '/studio'. If you want a different path, change '/studio' to your desired path.
// Make sure to use await!
app.use('/studio', await studio('/studio/api', mongoose));
```

### Mongoose Connections

If you create a new Mongoose connection using `mongoose.createConnection()`, you can pass it to Mongoose Studio as follows:

```javascript
const mongoose = require('mongoose');
const studio = require('@mongoosejs/studio/express');
// other code...

// Create a new Mongoose connection
const connection = mongoose.createConnection('mongodb://localhost:27017/mydb');

// Mount Mongoose Studio on '/studio'. If you want a different path, change '/studio' to your desired path.
app.use('/studio', await studio('/studio/api', connection));
```

Mongoose Studio currently only supports a single Mongoose connection.

### Configuration

If you have a Mongoose Studio Pro API key or wish to use advanced features, like providing your own OpenAI key, pass options as follows:

```javascript
const opts = {
  apiKey: process.env.MONGOOSE_STUDIO_API_KEY, // optional for Pro
  model: 'gpt-4o-mini', // optional ChatGPT model
  openAIAPIKey: process.env.OPENAI_API_KEY     // optional for chat locally
};

app.use('/studio', await studio('/studio/api', mongoose, opts));
```

---

## 3. Accessing Mongoose Studio

- In **local development**, visit `http://localhost:3000/studio` (or the path you choose).
- In **production**, Studio will be at `your-app.com/studio`.

---

## 4. Next Steps

- **Local Auth:** By default, authentication is not enabled. For production security and role management, check out [Mongoose Studio Pro](https://studio.mongoosejs.io/#pricing).
- **Demo:** Test drive with the [IMDB demo](https://studio.mongoosejs.io/imdb/#/).
- **Source:** Check out the [GitHub repo](https://github.com/mongoosejs/studio for examples and advanced setup.
- **Request a Feature (or Report a Bug):** Open an issue on [GitHub Issues](https://github.com/mongoosejs/studio/issues)
- **Get Help:** Join our [Discord server](https://discord.gg/P3YCfKYxpy) or open an issue on [GitHub Issues](https://github.com/mongoosejs/studio/issues)

---

**That’s it!** You can now manage your MongoDB data visually alongside your app, right from your own infrastructure.
