# FIKA Project Architecture

This document defines the high-level architecture, directory layout, integration interfaces, and engineering standards for the FIKA beauty and grooming marketplace platform.

---

## 1. Complete Folder Structure
FIKA is structured as a monorepo containing the mobile application, admin panel, web frontend, and backend configurations.

```
fika/
├── .github/
│   └── workflows/
│       └── ci-cd.yml             # CI/CD pipelines
├── backend/
│   ├── supabase/
│   │   ├── migrations/           # SQL migration files
│   │   └── functions/            # Edge functions
│   └── upstash/                  # Upstash config/scripts
├── apps/
│   ├── mobile/                   # Flutter Mobile App
│   ├── admin-dashboard/          # React Admin Dashboard
│   └── web-landing/              # Next.js Landing Page & Customer Web Client
├── shared/
│   ├── ts-types/                 # Shared TypeScript models/interfaces
│   └── assets/                   # Shared brand images, SVGs, and translation files
└── .env.example                  # Consolidated environment template
```

---

## 2. Flutter Project Structure
The mobile app is built using Flutter and follows a clean architecture pattern separated by feature modules.

```
apps/mobile/
├── android/
├── ios/
├── lib/
│   ├── core/
│   │   ├── constants/            # Theme, assets, dimensions, constants
│   │   ├── errors/               # Failure & exception definitions
│   │   ├── network/              # Connection checks and http wrappers
│   │   ├── theme/                # Custom AppColors (Royal Blue & Gold), Typography
│   │   └── utils/                # Date, currency, validation utilities
│   ├── data/
│   │   ├── datasources/          # Supabase & Local cache data sources
│   │   ├── models/               # JSON parsing models mapping from domain entities
│   │   └── repositories/         # Concrete repository implementations
│   ├── domain/
│   │   ├── entities/             # Pure business models
│   │   ├── repositories/         # Abstract repository contracts
│   │   └── usecases/             # Application-specific business rules
│   ├── presentation/
│   │   ├── state/                # State management handlers (Bloc/Riverpod)
│   │   ├── pages/                # Screens (Auth, Search, Booking, Profile)
│   │   └── widgets/              # Reusable UI components
│   └── main.dart                 # Application entry point
├── pubspec.yaml
└── README.md
```

---

## 3. React Admin Dashboard Structure
The admin portal is a single-page React app (built with Vite) that accesses data via Supabase JS SDK.

```
apps/admin-dashboard/
├── public/
├── src/
│   ├── assets/
│   ├── components/               # Admin components (sidebar, navbar, widgets)
│   │   ├── layout/
│   │   └── ui/                   # Buttons, tables, cards, charts, alerts
│   ├── config/                   # Supabase credentials, app settings
│   ├── hooks/                    # Reusable React hooks (useAuth, useVerification)
│   ├── layouts/                  # Auth layouts, main layout wrapper
│   ├── pages/                    # Views (Dashboard, Verification, Complaints, Audit)
│   ├── services/                 # Remote API service interfaces
│   ├── store/                    # State management (Zustand)
│   ├── types/                    # Domain typescript definitions
│   ├── utils/                    # Data formatters, permission flags
│   ├── App.tsx
│   ├── index.css                 # Primary Royal Blue (#0F4C81) and Gold (#D4AF37) custom styles
│   └── main.tsx
├── tailwind.config.js
├── vite.config.ts
├── package.json
└── README.md
```

---

## 4. Next.js Landing Page Structure
The Next.js application hosts the landing website and the web version of the Customer Portal.

```
apps/web-landing/
├── public/
├── src/
│   ├── app/                      # App router directory
│   │   ├── layout.tsx            # Global layout with Poppins/Inter integration
│   │   ├── page.tsx              # Landing Page (SEO optimized)
│   │   ├── auth/                 # Web login / register screens
│   │   ├── customer/             # Web customer search & checkout
│   │   └── providers/            # Provider profile directories
│   ├── components/               # Local UI units (Hero, Features, Pricing)
│   ├── context/                  # Context providers (Auth, Booking Cart)
│   ├── hooks/                    # React hooks
│   ├── lib/                      # Supabase, Redis, and Snippe integrations
│   └── styles/
│       └── globals.css
├── tailwind.config.js
├── next.config.js
├── package.json
└── README.md
```

---

## 5. Shared Architecture
* **Types**: Shared TypeScript interfaces in `shared/ts-types/` synchronize frontend objects (e.g., `Booking`, `Profile`, `Review`) between the React Admin Dashboard and Next.js Landing/Web portals.
* **Assets**: SVGs, brand assets, and localization dictionaries (English/Kiswahili JSON files) are stored in `shared/assets/` and symlinked or imported relative to individual application workspace scopes.
* **APIs**: Standardized JSON error response formats and HTTP status codes are implemented across all serverless endpoints.

---

## 6. Supabase Integration Architecture
Supabase operates as the central Backend-as-a-Service (BaaS) provider.

```
                  ┌─────────────────────────────────┐
                  │          Client Apps            │
                  │   (Flutter / React / Next.js)   │
                  └────────────────┬────────────────┘
                                   │
                                   │ HTTPS / WebSockets
                                   ▼
┌────────────────────────────────────────────────────────────────────────┐
│                              Supabase                                  │
│                                                                        │
│  ┌────────────────┐    ┌────────────────────┐    ┌──────────────────┐  │
│  │   Auth API     ├────► Profiles Trigger   ├────►  Profiles Table  │  │
│  │  (JWT Issued)  │    │  (Postgres Function│    │ (RLS Protected)  │  │
│  └────────────────┘    └────────────────────┘    └──────────────────┘  │
│                                                                        │
│  ┌────────────────┐    ┌────────────────────┐    ┌──────────────────┐  │
│  │   PostgreSQL   ├────►  Row Level Security├────► Database Client  │  │
│  │    Database    │    │ (Session JWT check)│    │   CRUD Queries   │  │
│  └────────────────┘    └────────────────────┘    └──────────────────┘  │
│                                                                        │
│  ┌────────────────┐                                                    │
│  │ Edge Functions ├────► Webhook handlers (Snippe.sh checkout updates)  │
│  └────────────────┘                                                    │
└────────────────────────────────────────────────────────────────────────┘
```

* **Authentication Sync**: User accounts generated through Supabase Auth invoke a database trigger `after signup` to inject the user record into the public `profiles` table.
* **Row-Level Security (RLS)**: Row-Level Security checks active JWT claims:
  * Users can read/write their own profile and saved addresses.
  * Customers can read provider profiles/services and insert bookings referencing themselves.
  * Providers can update their availability, edit their provider details, and read their bookings.
  * Admins override standard criteria to view audit logs, support tickets, and edit all data.
* **Edge Functions**: Light serverless TypeScript functions trigger secure external integrations (such as payment notifications or AI tasks).

---

## 7. Cloudflare R2 Integration Points
Cloudflare R2 provides S3-compatible object storage for heavy assets (e.g., service portfolios, verification records).

* **Direct Upload Channel**: Frontend clients query a Supabase Edge Function to generate a secure presigned upload URL directly pointing to a bucket path in Cloudflare R2:
  * Documents: `/verifications/{provider_id}/{document_name}.pdf`
  * Gallery: `/portfolios/{provider_id}/{image_id}.jpg`
* **CDN Distribution**: Uploaded image retrieval routes through a Cloudflare CDN worker optimized with cache headers for low-latency image delivery.

---

## 8. Upstash Redis Integration Points
Upstash Redis is configured as a fast cache layer and rate-limiter.

* **Rate Limiting**: Integrated into Edge Functions using `@upstash/ratelimit` to protect SMS OTP, AI search requests, and payment checkout initiation.
* **Provider Location Cache**: Active locations (from `provider_locations` table updates) cache in Redis for rapid geo-queries (e.g., "barbers within 5km").
* **Offline Caching**: Static tables (`service_categories`) are cached with short TTL configurations to minimize roundtrips to PostgreSQL.

---

## 9. Snippe.sh Payment Integration Architecture
Snippe.sh is the cashless gateway facilitating all transaction collections and commission payouts.

```
┌──────────────┐          1. Initiate Checkout          ┌───────────┐
│              ├────────────────────────────────────────►           │
│ Customer App │                                        │ Snippe.sh │
│              │◄───────────────────────────────────────┤  Gateway  │
└──────────────┘         2. Return Redirect URL         └─────┬─────┘
                                                              │
                                                              │ 3. HTTP POST Webhook
                                                              ▼
                                                     ┌──────────────────┐
                                                     │  Supabase Edge   │
                                                     │  Function Route  │
                                                     └────────┬─────────┘
                                                              │
                                                     4. Verify & Update
                                                              ▼
                                                     ┌──────────────────┐
                                                     │ PostgreSQL DB    │
                                                     │ (Bookings/Pay)   │
                                                     └──────────────────┘
```

* **Initiate Payment**: The client calls a secure edge API to request a payment session. This function compiles booking metadata and calls the Snippe.sh checkout API to get a redirection token/URL.
* **Verify Webhook Callback**: Upon payment authorization, Snippe.sh triggers an HTTP POST webhook containing a signature hash. The Supabase edge function validates the signature, marks the associated `payments` record status as `'success'`, and transitions the `bookings` status from `'pending_payment'` to `'confirmed'`.

---

## 10. GitHub Actions Workflow Structure
The CI/CD pipeline automates verification, quality checks, and deployment across platforms.

```yaml
# .github/workflows/ci-cd.yml
name: FIKA CI/CD Pipeline

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main, develop ]

jobs:
  lint-and-test:
    runs-on: ubuntu-latest
    steps:
      # - Checkout repo
      # - Set up Node.js & Flutter SDK
      # - Run Flutter tests and format validation
      # - Run Next.js / React build check and ESLint
      # - Run Supabase migration validation checks

  deploy-backend:
    needs: lint-and-test
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      # - Deploy Supabase Edge functions and apply migrations to production

  deploy-frontends:
    needs: lint-and-test
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      # - Deploy Next.js Web landing & React Admin to Netlify
```

---

## 11. Environment Variables Required (.env.example)
A unified `.env.example` file is placed in the project root.

```env
# ==============================================================================
# Supabase Configuration
# ==============================================================================
NEXT_PUBLIC_SUPABASE_URL=https://your-supabase-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# ==============================================================================
# Upstash Redis Settings
# ==============================================================================
UPSTASH_REDIS_REST_URL=https://your-database.upstash.io
UPSTASH_REDIS_REST_TOKEN=your_token_here

# ==============================================================================
# Cloudflare R2 Credentials
# ==============================================================================
R2_ACCOUNT_ID=your_cloudflare_account_id
R2_ACCESS_KEY_ID=your_access_key_id
R2_SECRET_ACCESS_KEY=your_secret_access_key
R2_BUCKET_NAME=fika-assets
NEXT_PUBLIC_R2_PUBLIC_URL=https://assets.fika.tz

# ==============================================================================
# Snippe.sh Gateway
# ==============================================================================
SNIPPE_API_KEY=sn_live_key_here
SNIPPE_WEBHOOK_SECRET=whsec_secret_here

# ==============================================================================
# AI Service Config
# ==============================================================================
OPENAI_API_KEY=sk-proj-your_key_here
```

---

## 12. Naming Conventions

### File & Directory Naming
* **TypeScript / React**:
  * Components: PascalCase (e.g. `BookingCard.tsx`)
  * Hooks, utils, styles: camelCase (e.g. `useAuth.ts`, `dateFormatter.ts`)
  * Layout folders: kebab-case (e.g. `admin-dashboard`)
* **Flutter**:
  * All files: snake_case (e.g. `booking_page.dart`, `custom_button.dart`)
  * Directories: snake_case (e.g. `datasources`, `presentation`)

### Code Elements
* **Variables & Functions**: camelCase (e.g. `const bookingData = ...`, `function handleCheckout() {}`)
* **Classes & Interfaces**: PascalCase (e.g. `class BookingRepository`, `interface UserProfile`)
* **Constants**: UPPER_SNAKE_CASE (e.g. `const DEFAULT_SERVICE_RADIUS = 10`)
* **Database Objects**: snake_case (e.g. `provider_profiles`, `booking_id`)

---

## 13. Coding Standards

### TypeScript / Next.js
* Use Strict Type Checking: `strict: true` in `tsconfig.json`. Explicit types are required for function arguments and return types.
* Prefer functional components and custom hooks.
* Maintain absolute imports (e.g., `@/components/ui/button`) instead of relative paths.
* Implement structured error blocks using try/catch. Avoid general catch constraints:
  ```typescript
  try {
    await apiCall();
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error occurred";
    logger.error(message);
  }
  ```

### Flutter / Dart
* Follow official Dart style guide directives (run `dart format` and `flutter lints`).
* Prefer `const` widgets wherever possible to optimize render cycles.
* Separate business logic from presentation layer code. UI files must not construct database calls or state computations directly.
* Use type-safe serialization models for all network requests.

---

## 14. State Management Architecture

### Flutter Mobile App
State management uses **Bloc** (Business Logic Component) or **Riverpod**:
* **UI Layer**: Dispatches events to Bloc/Riverpod providers based on user actions.
* **State Container**: Listens for events, invokes the appropriate use case from the domain layer, and emits states (e.g., `BookingLoading`, `BookingLoaded`, `BookingError`).
* **UI Repaint**: Presentation widgets rebuild using state listeners based on emitted values.

### React Admin Dashboard
State management uses **Zustand**:
* Stores are divided by concern: `useAuthStore`, `useVerificationStore`, and `useTicketStore`.
* State mutations are kept close to data logic inside the store methods to avoid component-level state pollution.

### Next.js Client
State management uses **React Context**:
* Context providers manage global features (e.g., `AuthContext` for user session and `CartContext` for service bookings).
* Localized form inputs rely on React `useState` hooks.

---

## 15. Repository Pattern
To isolate business rules from underlying data delivery mechanisms, we enforce the **Repository Pattern** across client architectures.

```
┌─────────────────┐
│  Presentation   │  Displays UI state changes
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│     Domain      │  Defines Use Cases & Repository interfaces (Contracts)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│      Data       │  Implements Repository interfaces (Supabase Client, R2 Client)
└─────────────────┘
```

* **Domain Contract (Example)**:
  ```typescript
  export interface IBookingRepository {
    getBookingById(id: string): Promise<Booking>;
    createBooking(booking: Omit<Booking, "id" | "created_at">): Promise<Booking>;
    updateBookingStatus(id: string, status: BookingStatus): Promise<void>;
  }
  ```
* **Data Implementation (Example)**:
  ```typescript
  import { supabase } from "../lib/supabaseClient";

  export class SupabaseBookingRepository implements IBookingRepository {
    async getBookingById(id: string): Promise<Booking> {
      const { data, error } = await supabase
        .from("bookings")
        .select("*")
        .eq("id", id)
        .single();
      if (error) throw new Error(error.message);
      return data;
    }
    // ... remaining interface implementations
  }
  ```
