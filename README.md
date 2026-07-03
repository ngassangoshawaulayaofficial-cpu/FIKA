# FIKA - Premium Beauty & Grooming On-Demand Marketplace

FIKA is a production-grade beauty and grooming on-demand marketplace connecting customers with professional stylists and groomers for home-visit appointments.

## Project Structure

This project is organized as a monorepo:

* **`apps/mobile`**: Flutter Mobile Client (Customer, Provider, and Admin apps).
* **`apps/web-landing`**: Next.js 16 (App Router) SEO-optimized Landing Page & Customer/Provider Portal.
* **`apps/admin-dashboard`**: React Admin panel built with Vite & TypeScript for superadmins and support teams.
* **`backend/supabase`**: Database migrations, RLS security configurations, and triggers.
* **`shared`**: Typings and assets shared across frontend applications.

---

## 1. Quick Start

### Prerequisites
* Node.js v18+
* npm or yarn
* Flutter SDK (for mobile compilation)

### Install Dependencies
Run command from the root workspace directory:
```bash
# Install Web Landing dependencies
cd apps/web-landing
npm install

# Install Admin Dashboard dependencies
cd ../admin-dashboard
npm install
```

### Development Run
* Run Next.js Portal:
  ```bash
  cd apps/web-landing
  npm run dev
  ```
* Run React Admin Portal:
  ```bash
  cd apps/admin-dashboard
  npm run dev
  ```

---

## 2. Testing & Verification

Ensure all validations pass clean before merging:

* **Linting Checks**:
  ```bash
  # Next.js App
  cd apps/web-landing
  npm run lint

  # React Admin
  cd apps/admin-dashboard
  npm run lint
  ```
* **Production Build Checks**:
  ```bash
  # Next.js App
  cd apps/web-landing
  npm run build

  # React Admin
  cd apps/admin-dashboard
  npm run build
  ```
