# Share Plate Platform - System Documentation

## Table of Contents
1. [Platform Overview](#platform-overview)
2. [User Roles & Permissions](#user-roles--permissions)
3. [Core Features](#core-features)
4. [End-to-End Workflows](#end-to-end-workflows)
5. [Admin Moderation](#admin-moderation)
6. [Data Flow & Analytics](#data-flow--analytics)
7. [Technical Architecture](#technical-architecture)
8. [Security & RLS Policies](#security--rls-policies)

---

## Platform Overview

Share Plate is a food rescue platform connecting restaurants (donors) with NGOs and shelters to reduce food waste and feed communities. The platform facilitates the donation of excess safe-to-eat food through a streamlined matching and coordination system.

### Key Objectives
- Reduce restaurant food waste
- Feed communities in need
- Enable real-time coordination between donors and recipients
- Provide transparent tracking of donations

---

## User Roles & Permissions

### 1. Donor (Restaurant)
- **Registration**: Email, password, organization name, contact details
- **Verification**: Requires admin approval before full access
- **Capabilities**:
  - Create food donation listings
  - View and manage incoming requests from NGOs
  - Accept or reject pickup requests
  - Mark donations as picked up/completed
  - Chat with confirmed NGOs
  - Give/receive feedback
  - Submit complaints about NGOs

### 2. NGO (Non-Governmental Organization)
- **Registration**: Email, password, organization name, contact details
- **Verification**: Requires admin approval before full access
- **Capabilities**:
  - Browse available donation listings
  - View listings on an interactive map
  - Request pickups for donations
  - Track request status (pending/confirmed/completed)
  - Chat with donors after confirmation
  - Give/receive feedback
  - Submit complaints about donors

### 3. Admin
- **Access**: Dedicated admin login portal
- **Capabilities**:
  - View all users (donors, NGOs)
  - Approve/reject user registrations
  - Change verification status at any time
  - View all donation listings
  - Access platform analytics
  - Manage complaints and feedback
  - Block users for violations
  - Add internal moderation notes

---

## Core Features

### Authentication System
- Email/password authentication via Supabase Auth
- Role-based access control (stored in `user_roles` table)
- Verification status check on login
- Blocked user detection
- Admin bypass for verification checks
- Profile auto-creation via database trigger

### Donation Listings
- **Fields**: Food type, category, quantity, packaging, pickup window, location (GPS), photos, hygiene notes, allergens
- **Status Flow**: Posted → Requested → Confirmed → Picked Up → Completed
- **Automatic GPS**: Donor's current location is auto-fetched during listing creation

### Request System
- NGOs can request pickups for available listings
- Donors receive real-time notifications
- Request statuses: Pending, Accepted, Rejected
- Contact details shared only after acceptance

### Map Integration
- Leaflet-based interactive map for NGOs
- Displays all available listings with coordinates
- Location-based browsing and filtering

### Chat System
- Real-time messaging between donor and NGO
- Available only after request confirmation
- Message timestamps and history

### Notification System
- In-app notifications via bell dropdown
- Real-time updates via Supabase subscriptions
- Push notification support (Web Push)
- Email notifications for key events

### Feedback & Rating
- Star rating (1-5) with optional comments
- Available after donation completion
- Two-way: Donor rates NGO, NGO rates Donor
- **Feedback History**: Visible on Profile page with tabs for received/given
- Average rating displayed with total review count

### Complaint System
- Report issues: inappropriate behavior, food quality, no-show, communication, safety, other
- Admin review and resolution workflow
- Status tracking: pending, reviewing, resolved, dismissed

### Request Reconsideration
- Donors can reconsider and accept previously rejected requests
- "Reconsider & Accept" button available on rejected requests
- Only available when listing is not yet confirmed/completed

---

## End-to-End Workflows

### Donor Workflow
1. **Register** → Create account with organization details
2. **Wait for Approval** → Admin verifies account
3. **Create Listing** → Add food details, auto-fetch location
4. **View Dashboard** → See pending request count and list in real-time
5. **Receive Requests** → View NGO pickup requests with real-time updates
6. **Accept/Reject Request** → Confirm pickup or decline
7. **Reconsider** → Can re-accept previously rejected requests if needed
8. **Coordinate** → Chat with NGO for pickup logistics
9. **Mark Complete** → Confirm successful handover
10. **Give Feedback** → Rate the NGO (visible on profile)

### NGO Workflow
1. **Register** → Create account with organization details
2. **Wait for Approval** → Admin verifies account
3. **Browse Listings** → Explore map or list view
4. **Request Pickup** → Submit request with preferred time
5. **Wait for Confirmation** → Donor reviews request
6. **Coordinate** → Access donor contact, use chat
7. **Complete Pickup** → Collect food donation
8. **Give Feedback** → Rate the donor

### Admin Workflow
1. **Login** → Dedicated admin portal
2. **Review Registrations** → Approve/reject pending users
3. **Monitor Platform** → View analytics, listings, activity
4. **Handle Complaints** → Review, investigate, resolve
5. **Moderate Users** → Block/unblock, add notes
6. **Manage Status** → Re-approve or re-reject users as needed

---

## Admin Moderation

### User Management
- View all users with role and verification status
- Approve/Reject buttons always visible for all users
- Confirmation dialog before status changes
- Real-time UI updates after changes

### Complaint Handling
- View all submitted complaints
- Update complaint status (pending → reviewing → resolved/dismissed)
- Add admin notes for internal tracking
- Link complaints to specific listings

### User Blocking
- Block users for policy violations
- Record reason for blocking
- Blocked users cannot log in
- Unblock capability for resolved cases

---

## Data Flow & Analytics

### Dashboard Statistics
- Total donations (from `donation_listings`)
- Completed donations
- Active users (approved)
- Pending requests
- User distribution (donors vs NGOs)

### Analytics Charts
- Monthly donations (from `monthly_analytics` table)
- Meals served over time
- Listing status distribution (pie chart)
- User type distribution (pie chart)

### Data Sources
- All charts use real database data
- Monthly analytics updated programmatically
- No hardcoded/mock data in production

---

## Technical Architecture

### Frontend
- **Framework**: React 18 with TypeScript
- **Styling**: Tailwind CSS with design tokens
- **State Management**: TanStack React Query
- **Routing**: React Router v6
- **Charts**: Recharts
- **Maps**: Leaflet / React-Leaflet
- **UI Components**: shadcn/ui (Radix primitives)

### Backend (Lovable Cloud / Supabase)
- **Database**: PostgreSQL
- **Authentication**: Supabase Auth
- **Real-time**: Supabase Realtime subscriptions
- **Storage**: Supabase Storage (food photos)
- **Edge Functions**: Deno-based serverless functions
- **Email**: Resend API via edge functions

### Key Tables
- `profiles` - User profile data
- `user_roles` - Role assignments (donor/ngo/admin)
- `donation_listings` - Food donations
- `donation_requests` - Pickup requests
- `chat_messages` - Real-time chat
- `notifications` - In-app notifications
- `feedback` - Ratings and reviews
- `complaints` - User complaints
- `monthly_analytics` - Aggregated stats

---

## Security & RLS Policies

### Row Level Security (RLS)
All tables have RLS enabled with appropriate policies:

- **Profiles**: Public read, own-user write, admin update
- **User Roles**: Own-user read, admin manage
- **Donation Listings**: Public read, donor create/update/delete
- **Donation Requests**: Participant read, NGO create, donor/NGO update
- **Chat Messages**: Participant read/write
- **Notifications**: Own-user read/update
- **Feedback**: Public read, participant create
- **Complaints**: Participant read, user create, admin update

### Authentication Flow
1. User submits credentials
2. Loading state activated to prevent race conditions
3. Supabase Auth validates credentials
4. Role fetched from `user_roles` and Profile fetched from `profiles` in parallel
5. Session and user state set immediately
6. Blocked status checked (blocked users are signed out)
7. Verification status checked (admins bypass this check)
8. For non-admin users with pending/rejected status: signed out with error
9. Loading state deactivated only after all data is ready
10. User redirected to role-appropriate dashboard
11. Access granted or denied with appropriate message

### Security Best Practices
- No sensitive data in client-side storage
- Server-side role validation
- Parameterized queries (no raw SQL)
- Input validation and sanitization
- CORS headers on edge functions

---

## Production Deployment

### Environment Variables
- `VITE_SUPABASE_URL` - Supabase project URL
- `VITE_SUPABASE_PUBLISHABLE_KEY` - Supabase anon key

### Secrets (Edge Functions)
- `SUPABASE_SERVICE_ROLE_KEY` - Admin access
- `RESEND_API_KEY` - Email service
- `VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` - Push notifications

### Pre-deployment Checklist
- [ ] All RLS policies verified
- [ ] No console errors/warnings
- [ ] Email templates configured
- [ ] Push notifications tested
- [ ] Admin account created
- [ ] Sample data seeded (if needed)

---

*Last Updated: January 2026*
