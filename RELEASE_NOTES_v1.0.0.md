# RELEASE NOTES - FIKA PLATFORM v1.0.0

**Release Status**: **Gold Master**  
**Lead Architect**: Antigravity, Principal Software Architect  

We are excited to announce the production release of the FIKA Beauty and Grooming On-Demand Marketplace Platform. This release wraps up all features, database tables, and client portals.

---

## What's New in v1.0.0

### 1. Customer & Provider Portals (`apps/web-landing`)
* **Cashless Payments**: Cashless payments via Vodacom M-Pesa, Airtel Money, and Visa/Mastercard using Snippe.sh gateway.
* **Realtime Chat & Messaging**: Fully integrated Customer-to-Provider threads with image uploads and Google Maps location pins.
* **Ratings & Reviews**: Completed review forms with automated average calculations on provider tables.
* **Address Manager**: Custom labels and location saving for rapid booking.

### 2. React Admin Console (`apps/admin-dashboard`)
* **Superadmin & Support Exclusions**: Enforced metadata checking to disable finance table metrics for support roles.
* **Mod Audit Tools**: Flags moderation queue, reviews reporter actions, and Chat Thread auditing.
* **Statement Exporters**: Download platform transactions logs as CSV tables.

### 3. Flutter Mobile Client (`apps/mobile`)
* **Statistics Cards**: Metrics graphs, scheduled calendar widgets, and wallets dashboard.
* **Cross-Role Routing**: Dynamic splash screen credentials checks to route user accounts (Customer vs. Provider vs. Admin).

---

## Monorepo Compatibility Matrix

| Module | Build CLI | Output |
| :--- | :--- | :--- |
| **Next.js Portal** | `next build` | Webpack Client Static & SSR |
| **React Admin** | `vite build` | Vite Single Page App |
| **Mobile Client** | `flutter build` | Release APK / AppBundle / IPA |
| **Database** | `supabase db push` | PostgreSQL Migrations |
