# PRD.md

# FIKA – Product Requirements Document (v1.0)

## 1. Overview
FIKA is an on-demand beauty and grooming marketplace focused on Dar es Salaam. It connects busy professionals, government employees, business owners, tourists, and travelers with verified barbers, hairstylists, and beauty professionals who travel to the customer's location. The core value proposition is saving time through trusted, location-based, cashless bookings.

## 2. Problem & Solution
### Problem
- Busy people waste time traveling and waiting at salons.
- Difficult to find trusted professionals.
- Booking is fragmented through calls and WhatsApp.
- Payments and pricing are inconsistent.

### Solution
FIKA provides verified professionals, transparent pricing, instant booking, real-time booking status, digital payments via Snippe.sh, ratings, and reviews.

## 3. Target Users
Primary:
- Government employees
- Office workers
- Business owners
- Executives
- Tourists
- Hotel guests

Secondary:
- Students
- Families
- Event clients

Providers:
- Barbers
- Hairstylists
- Braiders
- Phase 2: Massage, Nails, Makeup

## 4. Core Features
Authentication, Customer Profiles, Provider Profiles, Search & Filters, Booking, Payments, Reviews, Notifications, Admin Dashboard.

## 5. User Flows
Customer: Register → Search → Book → Pay → Service → Review.
Provider: Register → Verify → Go Online → Accept Booking.
Payment: Checkout → Snippe.sh → Success → Booking Confirmed.

## 6. Data Model
Tables:
profiles, provider_profiles, service_categories, provider_services,
provider_gallery, bookings, booking_services, payments, reviews,
notifications, saved_addresses, provider_locations, support_tickets,
complaints, promotions, coupons, withdrawals, audit_logs.

## 7. AI Features
Uses AI:
- Natural language search
- Recommendations
- Review summarization
- Fraud detection
- FAQ assistant

AI must NOT:
- Approve providers
- Calculate prices
- Handle payments
- Release earnings
- Decide disputes

## 8. Monetization
- 15% booking commission
- Premium providers
- Featured listings
- Sponsored promotions
Payments via Snippe.sh only.

## 9. Design
Primary: Royal Blue (#0F4C81)
Accent: Gold (#D4AF37)
Typography: Poppins + Inter

## 10. Non-Functional Requirements
Flutter, React, Next.js, Supabase, Upstash Redis, Cloudflare R2,
Netlify, GitHub Actions.
RLS enabled.
Offline cache for recent data.
English + Kiswahili.

## 11. MVP
Registration, Verification, Search, Booking, Payments, Reviews, Notifications, Admin.

Phase 2:
Chat, GPS, AI recommendations, Coupons.

Phase 3:
Massage, Makeup, Nails, Marketplace.

## 12. Open Questions
Brand assets, refund policy, commission %, verification rules, service radius.
