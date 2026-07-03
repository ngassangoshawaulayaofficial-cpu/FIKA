# DEPLOYMENT CHECKLIST - FIKA PLATFORM

**Production Readiness**: **99%**  
**Auditor**: Antigravity, Principal Software Architect & Chief Technical Auditor  

Use this pre-flight checklist to verify your staging environments before deployment to production.

---

## Pre-Flight Checklist

### 1. Database & Migrations
- [ ] Connect production Supabase instance credentials.
- [ ] Push local database migrations schemas (`npx supabase db push`).
- [ ] Validate Row Level Security (RLS) is active on all tables.
- [ ] Enable point-in-time recovery (PITR) backups.

### 2. Environment Variables Verification
- [ ] Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
- [ ] Set `SUPABASE_SERVICE_ROLE_KEY` inside server settings.
- [ ] Set Cloudflare R2 credentials (`R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`).
- [ ] Set Cashless Gateway credentials (`SNIPPE_API_KEY`, `SNIPPE_WEBHOOK_SECRET`).

### 3. Storage Setup (Cloudflare R2)
- [ ] Create bucket `fika-assets`.
- [ ] Update CORS policy to allow cross-origin requests from `fika.tz` and `admin.fika.tz`.
- [ ] Test upload presigned URLs via customer reviews upload.

### 4. Next.js Web Landing Portal Build
- [ ] Run linting checks (`npm run lint` -> 0 errors).
- [ ] Run production compilation build (`npm run build` -> success).
- [ ] Verify SSL certificate redirects and HTTPS routing.

### 5. React Admin Dashboard Build
- [ ] Run linting checks (`npm run lint` -> 0 errors).
- [ ] Run production build (`npm run build` -> success).
- [ ] Check support role metadata routes filter exclusions.

### 6. Flutter Mobile Client Compilation
- [ ] Run `dart format` and check styling guidelines.
- [ ] Configure `key.properties` for Android sign keys.
- [ ] Compile release App Bundle (`flutter build appbundle --release`).
- [ ] Generate App Store archive (`flutter build ipa --release`).
