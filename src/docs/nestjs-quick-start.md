---
title: Nest.js Quick Start Guide
description: Add Mongoose Studio to your Nest.js app using the same Mongoose connection as @nestjs/mongoose.
---

# Nest.js Quick Start Guide

Welcome to **Mongoose Studio**!
This guide will help you add Mongoose Studio to a Nest.js app that uses `@nestjs/mongoose`.

---

## 1. Install the Packages

Install Mongoose Studio, Mongoose, and the Nest Mongoose integration:

```bash
npm install @mongoosejs/studio @nestjs/mongoose mongoose
```

---

## 2. Add Mongoose Studio to Your App Module

Use `MongooseStudioModule` from `@mongoosejs/studio/nest`.
The `connectionToken` option lets Studio use the same Mongoose connection that `MongooseModule.forRoot()` creates.

```typescript
import { Module } from '@nestjs/common';
import { MongooseModule, getConnectionToken } from '@nestjs/mongoose';
import { MongooseStudioModule } from '@mongoosejs/studio/nest';

@Module({
  imports: [
    MongooseModule.forRoot(process.env.MONGODB_URI),
    MongooseStudioModule.forRoot({
      path: '/studio',
      connectionToken: getConnectionToken()
    })
  ]
})
export class AppModule {}
```

With this setup, Mongoose Studio is mounted at `/studio`.

### Custom Paths

To mount Studio on a different path, set `path`:

```typescript
MongooseStudioModule.forRoot({
  path: '/admin/studio',
  connectionToken: getConnectionToken()
})
```

Mongoose Studio will automatically use `/admin/studio/api` for its API routes.

### Mongoose Studio Pro

If you have a Mongoose Studio Pro API key or wish to use advanced features, pass options as follows:

```typescript
MongooseStudioModule.forRoot({
  path: '/studio',
  connectionToken: getConnectionToken(),
  apiKey: process.env.MONGOOSE_STUDIO_API_KEY,
  model: 'gpt-4o-mini',
  openAIAPIKey: process.env.OPENAI_API_KEY
})
```

---

## 3. Accessing Mongoose Studio

- In **local development**, visit `http://localhost:3000/studio` (or the path you choose).
- In **production**, Studio will be at `your-app.com/studio`.

---

## 4. Next Steps

- **Local Auth:** By default, authentication is not enabled. For production security and role management, check out [Mongoose Studio Pro](https://studio.mongoosejs.io/#pricing).
- **Demo:** Test drive with the [IMDB demo](https://studio.mongoosejs.io/imdb/#/).
- **Source:** Check out the [GitHub repo](https://github.com/mongoosejs/studio) for examples and advanced setup.
- **Request a Feature (or Report a Bug):** Open an issue on [GitHub Issues](https://github.com/mongoosejs/studio/issues)
- **Get Help:** Join our [Discord server](https://discord.gg/P3YCfKYxpy) or open an issue on [GitHub Issues](https://github.com/mongoosejs/studio/issues)

---

**That’s it!** You can now manage your MongoDB data visually alongside your Nest.js app.
