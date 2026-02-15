# Backend API Summary - SecureLearning Platform

## Overview

Your platform is a **multi-tenant phishing simulation system** built with FastAPI. This document summarizes the primary endpoints and business logic for campaign creation, user authentication, and tracking.

---

## 1. Campaign Creation & Scheduling Logic

### Business Process

- **Target Selection**: Campaigns target user groups from Keycloak
- **Interval Calculation**: System calculates optimal email sending intervals (minimum 6 seconds) based on campaign duration and recipient count
- **Email Scheduling**: Creates individual `EmailSending` records, each scheduled incrementally to spread emails evenly across the campaign timeframe
- **Queue Processing**: All emails are queued to RabbitMQ immediately after campaign creation
- **Status Updates**: A background APScheduler updates campaign statuses every minute:
  - `SCHEDULED` → `RUNNING` (when begin_date is reached)
  - `RUNNING` → `COMPLETED` (when end_date is reached)
- **Template Management**: Templates are stored in MongoDB but referenced in PostgreSQL for metadata

### Key Endpoints

- `POST /api/campaigns` - Create a new campaign with scheduled email sendings
- `GET /api/campaigns` - Fetch all campaigns for the current realm
- `GET /api/campaigns/{id}` - Fetch detailed campaign information by ID
- `GET /api/campaigns/stats` - Fetch global campaign statistics for the realm
- `POST /api/campaigns/{id}/cancel` - Cancel a campaign and mark pending emails as failed

---

## 2. User Authentication & Tenant Assignment

### Business Process

- **Multi-Tenancy Model**: Uses **Keycloak realms** for multi-tenancy (each tenant = separate realm)
- **Token-Based Scoping**: JWT tokens contain the realm in the `iss` (issuer) claim, automatically scoping all API requests to the user's tenant
- **Authentication Flow**: Users authenticate via OAuth2 Authorization Code flow through Keycloak
- **Authorization**: Uses UMA (User-Managed Access) for resource-level permissions (format: `resource#scope`)
- **Tenant Creation**: Synchronizes Keycloak realms with PostgreSQL `Realm` table
- **User Management**: Users are created in Keycloak and synchronized to PostgreSQL with `keycloak_id` as primary key
- **Group Management**: User groups are managed in Keycloak and synchronized locally for campaign targeting

### Key Endpoints

- `POST /api/realms` - Create a new tenant realm in Keycloak
- `GET /api/realms` - Find realm by domain (for login routing)
- `DELETE /api/realms/{realm}` - Delete a tenant realm and all associated data
- `POST /api/realms/users` - Create a new user in a specific realm
- `GET /api/realms/{realm}/users` - List all users in a realm
- `GET /api/realms/{realm}/users/{user_id}` - Get specific user details
- `DELETE /api/realms/{realm}/users/{user_id}` - Delete a user from the realm
- `POST /api/realms/{realm}/groups` - Create a user group within a realm
- `GET /api/realms/{realm}/groups` - List all groups in a realm
- `POST /api/realms/{realm}/groups/{group_id}/members/{user_id}` - Add user to group
- `GET /api/realms/{realm}/groups/{group_id}/members` - List group members
- `DELETE /api/realms/{realm}/groups/{group_id}/members/{user_id}` - Remove user from group

---

## 3. Tracking Logic: Clicks & Submissions

### Business Process

- **Unique Tokens**: Each email gets a unique `tracking_token` (256-bit random, urlsafe base64)
- **Email Sent**: SMTP service calls `/track/sent` after successful delivery, updates `sent_at` timestamp and status to `SENT`
- **Email Opened**: 1x1 transparent tracking pixel loads `/track/open`, records `opened_at` timestamp and status to `OPENED`
- **Link Clicked**: All email links are rewritten to `/track/click?si={token}`, which:
  - Records `clicked_at` timestamp and status to `CLICKED`
  - Renders and returns the landing page HTML to the user
  - Landing page contains a form that posts to `/track/phish`
- **Credentials Submitted**: Landing page form posts to `/track/phish`, records `phished_at` timestamp and status to `PHISHED`
- **Tracking Behaviors**:
  - All tracking is **idempotent** (only the first event of each type is recorded)
  - Tracking is **cascading** (click implies open, phish implies both click and open)
  - Campaign counters (`total_opened`, `total_clicked`, `total_phished`) are incremented in real-time
  - No actual credentials are stored (compliance/privacy)

### Key Endpoints

- `POST /api/track/sent` - Record successful email delivery (called by SMTP service)
- `POST /api/track/open` - Record email open event (tracking pixel endpoint)
- `GET /api/track/click` - Record link click and redirect to landing page
- `POST /api/track/phish` - Record credential submission on landing page

### Tracking Flow

```
Email Sent → [SMTP Service] → /track/sent
  ↓
Email Opened → [Tracking Pixel] → /track/open
  ↓
Link Clicked → [Rewritten URL] → /track/click → [Landing Page Rendered]
  ↓
Credentials Submitted → [Landing Page Form] → /track/phish
```

---

## Technology Stack

- **API Framework**: FastAPI (Python)
- **Relational Database**: PostgreSQL via SQLModel (ORM)
- **Document Database**: MongoDB (email/landing page template storage)
- **Authentication**: Keycloak (OAuth2 + OIDC)
- **Message Queue**: RabbitMQ (email scheduling and delivery)
- **Task Scheduler**: APScheduler (campaign status updates)

---

## Database Models

### PostgreSQL Tables

**Campaign**
- Core fields: id, name, description, begin_date, end_date, status
- Counters: total_recipients, total_sent, total_opened, total_clicked, total_phished
- Foreign keys: realm_name, sending_profile_id, email_template_id, landing_page_template_id

**EmailSending**
- Core fields: id, user_id, campaign_id, email_to, tracking_token
- Schedule: scheduled_date, status
- Tracking timestamps: sent_at, opened_at, clicked_at, phished_at

**Realm**
- Fields: name (PK), domain (unique)
- Represents a tenant in the system

**User**
- Fields: keycloak_id (PK), email, is_org_manager
- Synchronized from Keycloak

**UserGroup**
- Fields: keycloak_id (PK)
- Synchronized from Keycloak for campaign targeting

### MongoDB Collections

**templates**
- Fields: _id, name, path, subject, category, html, created_at, updated_at
- Stores Jinja2 templates for emails and landing pages

---

## Key Business Rules

1. **Minimum Sending Interval**: 6 seconds between emails (prevents SMTP rate limiting)
2. **Campaign Auto-Progression**: Statuses update automatically based on time via background scheduler
3. **Tracking Cascades**: Higher-level events automatically record lower-level events
4. **Idempotent Tracking**: Duplicate events are ignored (only first event recorded per type)
5. **Tenant Isolation**: All operations automatically scoped to user's realm from JWT token
6. **Org Manager Protection**: Cannot delete the last org_manager in a realm
7. **No Credential Storage**: Phishing submissions recorded as events only (compliance)

---

## Security Considerations

- **Token Validation**: All endpoints require valid OAuth2 tokens from Keycloak
- **Permission Enforcement**: UMA permissions checked before sensitive operations
- **Realm Isolation**: Database queries always filter by realm_name to prevent cross-tenant access
- **Tracking Token Security**: 256-bit random tokens using urlsafe base64 encoding
- **SQL Injection Protection**: SQLModel ORM with parameterized queries
- **CORS Configuration**: Only frontend URL allowed in CORS policy
