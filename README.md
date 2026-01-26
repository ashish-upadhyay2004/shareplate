# Share Plate Platform - System Documentation

## 📑 Table of Contents

1. Platform Overview
2. User Roles & Permissions
3. Core Features
4. End-to-End Workflows
5. Admin Moderation
6. Data Flow & Analytics
7. Technical Architecture
8. Security & RLS Policies
9. Deployment & Configuration

---

## 1️⃣ Platform Overview

Share Plate is a food rescue platform that connects restaurants (donors) with NGOs and shelters to reduce food waste and support communities in need. The system enables secure, real-time coordination for food donation and pickup.

### Key Objectives

* Reduce restaurant food waste
* Feed communities in need
* Enable real-time coordination
* Provide transparent tracking

---

## 2️⃣ User Roles & Permissions

### Donor (Restaurant)

**Capabilities:**

* Create donation listings
* Manage NGO requests
* Confirm pickups
* Chat with NGOs
* Give feedback
* Submit complaints

---

### NGO

**Capabilities:**

* Browse listings
* View map-based listings
* Request pickups
* Track status
* Chat with donors
* Give feedback
* Submit complaints

---

### Admin

**Capabilities:**

* Approve/reject users
* Monitor listings
* Access analytics
* Manage complaints
* Block users
* Add moderation notes

---

## 3️⃣ Core Features

### Authentication System

* Supabase Auth (Email/Password)
* Role-based access control
* Verification checks
* Blocked user detection
* Auto profile creation

---

### Donation Listings

* Fields: food type, quantity, packaging, location, photos, allergens
* Status: Posted → Requested → Confirmed → Picked Up → Completed
* Two-party confirmation system
* Auto GPS fetch

---

### Request System

* NGO pickup requests
* Real-time donor notifications
* Status: Pending / Accepted / Rejected
* Contact sharing after acceptance

---

### Map Integration

* Leaflet-based map
* Location filtering
* Real-time markers

---

### Chat System

* Real-time messaging
* Available after confirmation
* Timestamped messages

---

### Notification System

* In-app alerts
* Supabase Realtime
* Web push support
* Email alerts

---

### Feedback & Rating

* 1–5 star rating
* Two-way reviews
* Profile history
* Average score display

---

### Complaint System

* Issue reporting
* Admin review
* Status tracking
* Listing linkage

---

### Request Reconsideration

* Re-accept rejected requests
* Conditional availability

---

## 4️⃣ End-to-End Workflows

### Donor Workflow

1. Register
2. Admin approval
3. Create listing
4. Receive requests
5. Accept/reject
6. Coordinate via chat
7. NGO pickup
8. Confirm completion
9. Give feedback

---

### NGO Workflow

1. Register
2. Admin approval
3. Browse listings
4. Request pickup
5. Coordinate
6. Mark pickup
7. Wait for completion
8. Give feedback

---

### Admin Workflow

1. Login
2. Review users
3. Monitor activity
4. Handle complaints
5. Moderate users
6. Manage status

---

## 5️⃣ Admin Moderation

### User Management

* Approve / Reject users
* Status updates
* Real-time UI refresh

### Complaint Handling

* Review workflow
* Admin notes
* Status updates

### User Blocking

* Block/unblock users
* Record reasons

---

## 6️⃣ Data Flow & Analytics

### Dashboard Statistics

* Total donations
* Completed listings
* Active users
* Pending requests

### Analytics Charts

* Monthly donations
* Meals served
* Status distribution
* User distribution

### Data Sources

* Live database queries
* Automated aggregation

---

## 7️⃣ Technical Architecture

### Frontend

* React 18 + TypeScript
* Tailwind CSS
* TanStack Query
* React Router v6
* Recharts
* React-Leaflet
* shadcn/ui

### Backend

* Supabase (PostgreSQL)
* Supabase Auth
* Realtime subscriptions
* Storage buckets
* Edge Functions (Deno)
* Resend API

---

### Key Database Tables

* profiles
* user_roles
* donation_listings
* donation_requests
* chat_messages
* notifications
* feedback
* complaints
* monthly_analytics

---

## 8️⃣ Security & RLS Policies

### Row Level Security

* Profiles: public read, own write, admin update
* Roles: admin manage
* Listings: donor manage, public read
* Requests: participant access
* Chat: participant access
* Notifications: own access
* Feedback: public read, participant write
* Complaints: admin update

---

### Authentication Flow

1. Credential submission
2. Loading state
3. Supabase validation
4. Role + profile fetch
5. Block/verify check
6. Session creation
7. Dashboard redirect

---

### Security Best Practices

* No sensitive client storage
* Server-side role checks
* Input validation
* CORS protection
* Parameterized queries

---

## 9️⃣ Deployment & Configuration

### Environment Variables

```env
VITE_SUPABASE_URL=
VITE_SUPABASE_PUBLISHABLE_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
```

---

### Secrets (Edge Functions)

* SUPABASE_SERVICE_ROLE_KEY
* RESEND_API_KEY
* VAPID_PUBLIC_KEY
* VAPID_PRIVATE_KEY

---

### Pre-Deployment Checklist

* RLS verified
* No console errors
* Email configured
* Push notifications tested
* Admin account created
* Sample data seeded

---

## 📅 Last Updated

January 2026

---

## 👤 Author

Ashish Upadhyay
B.Tech IT | Full Stack Developer
