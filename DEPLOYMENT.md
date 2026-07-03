# FIKA - Production Deployment Guide

This guide outlines the production deployment setup for all FIKA platform monorepo components (Next.js, React Admin, Flutter, and Supabase database).

---

## 1. Supabase Database & Migrations

To apply database tables, security policies, triggers, and function procedures in production:

1. Link the local repository to your Supabase production project:
   ```bash
   npx supabase link --project-ref your-prod-project-ref
   ```
2. Deploy the migration schemas:
   ```bash
   npx supabase db push
   ```
3. Enable point-in-time recovery (PITR) and automatic daily backups under the Supabase Database settings panel.
4. Configure database connection pooling (PgBouncer/Supavisor) on port `6543` for high concurrency API tasks.

---

## 2. Cloudflare R2 Storage Setup

1. Create a private bucket in your Cloudflare dashboard named `fika-assets`.
2. Configure CORS settings for the bucket to allow resource sharing:
   ```json
   [
     {
       "AllowedOrigins": ["https://fika.tz", "https://admin.fika.tz"],
       "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
       "AllowedHeaders": ["*"]
     }
   ]
   ```
3. Configure the public domain CDN caching routes on Cloudflare (e.g. `https://assets.fika.tz`) targeting the R2 bucket.

---

## 3. Next.js Web Landing Portal Deployment

The Next.js customer/provider hub is optimized for Vercel/VPS servers:

1. Set up the production host server matching the environment keys inside `apps/web-landing/.env.example`.
2. Run the production build command:
   ```bash
   npm run build
   ```
3. Deploy the compiled output. If deploying on Vercel, the configuration is resolved automatically.

---

## 4. React Admin Dashboard Deployment

The admin interface runs as a static client bundle:

1. Configure variables defined in `apps/admin-dashboard/.env.example`.
2. Build static SPA files:
   ```bash
   npm run build
   ```
3. Host the resulting `dist/` directory on Cloudflare Pages, Netlify, or AWS S3.

---

## 5. Flutter Mobile Applications Build

### Android Production Build
1. Set up signing keys in `apps/mobile/android/key.properties`.
2. Build the production App Bundle:
   ```bash
   flutter build appbundle --release
   ```

### iOS Production Build
1. Set up Apple Developer Team credentials inside Xcode.
2. Build the App Store archive:
   ```bash
   flutter build ipa --release
   ```

---

## 6. Monitoring & Health Checks
* **Errors Logging**: Connect Sentry for automatic frontend and mobile crash tracking.
* **Server Health**: Set up automated Ping check alerts for `/api/payments/webhook` endpoint returns.
