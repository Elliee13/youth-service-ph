# Notification System Plan V1

## 1. Purpose
Add a structured in-app notification system that keeps users informed about important activity in the platform.

This system should improve communication across:
- member users
- chapter heads
- admins

The system must be incremental, secure, and production-safe.

## 2. Core Product Goal
Users should receive timely in-app notifications about relevant events without introducing noisy, unreliable, or overcomplicated behavior.

The notification system should support:
- workflow notifications
- role-targeted updates
- admin announcements
- unread/read state
- actionable links

## 3. Guiding Principles
### 3.1 Start With In-App Notifications First
Do not begin with email, SMS, or push notifications.

The first version should be fully in-app so it is easier to build, test, and maintain.

### 3.2 Store Notifications As Real Data
Notifications should not be ad hoc UI banners.

They should be stored records with clear type, recipient, content, and read state.

### 3.3 Separate Workflow Notifications From Admin Announcements
The system should support both, but they are different product concepts.

### 3.4 Keep The First Version Narrow And Useful
Only include the highest-value notification types first.

### 3.5 Use Trusted Backend Creation Paths Where Needed
Notifications that depend on protected workflow events should be created from trusted logic, not only browser assumptions.

## 4. Primary Audiences
### 4.1 Member Users
These are authenticated public-side users.

Initial relevant notifications:
- `application_received`
- `new_opportunity` if explicitly announced
- `new_program` if explicitly announced
- `new_form_available` if explicitly announced
- `announcement_member`
- `announcement_all`

### 4.2 Chapter Heads
Initial relevant notifications:
- `opportunity_approved`
- `new_opportunity_application`
- `announcement_chapter_head`
- `announcement_all`

### 4.3 Admins
Initial relevant notifications:
- `opportunity_approval_required`

## 5. Recommended Scope By Phase
### 5.1 Phase 1: Core Notification System
Build:
- `notifications` table
- unread/read logic
- notification center UI
- unread badge/count
- mark as read

### 5.2 Phase 2: Automatic Workflow Notifications
Automatically create notifications when:
- chapter head submits opportunity -> admin notified
- admin approves opportunity -> chapter head notified
- member applies to opportunity -> chapter head notified
- member application submitted -> member notified

### 5.3 Phase 3: Admin Announcements
Admin can create announcements targeted to:
- members only
- chapter heads only
- both

These announcements should be distributed into user notifications.

## 6. Recommended V1 Feature Set
V1 should include:

### 6.1 In-App Notification Center
- bell icon with unread count
- dropdown preview or notifications page
- notification list
- mark individual notification as read

### 6.2 Automatic Workflow Notifications
- admin notified when a chapter-head-created opportunity is pending approval
- chapter head notified when their opportunity is approved
- chapter head notified when a member applies to one of their opportunities
- member notified when their application is received

### 6.3 Admin Announcements
- admin can create a custom announcement
- target audience options:
  - members only
  - chapter heads only
  - both
- optional link field
- announcement is distributed into notifications for matching users

## 7. Recommended Data Model
### 7.1 Table: `notifications`
Purpose:
Stores user-specific notification records.

Suggested fields:
- `id`
- `recipient_user_id`
- `type`
- `title`
- `message`
- `link`
- `is_read`
- `read_at`
- `created_at`
- `actor_user_id` optional
- `entity_type` optional
- `entity_id` optional

Recommended notes:
- `recipient_user_id` should be the main recipient identity
- `type` should be structured and not freeform-only
- `link` should be optional but supported
- read state must be stored per user

### 7.2 Table: `announcements`
Purpose:
Stores admin-authored broadcast announcements.

Suggested fields:
- `id`
- `title`
- `message`
- `audience`
- `link` optional
- `is_active`
- `created_by`
- `created_at`

Recommended audience values:
- `member`
- `chapter_head`
- `both`

Recommended delivery model:
When admin creates an announcement, fan it out into notifications for matching users.

This is simpler than trying to dynamically merge announcements at read time.

## 8. Recommended Notification Types
### 8.1 Member Notification Types
- `application_received`
- `announcement_member`
- `announcement_all`
- `new_opportunity` if explicitly announced
- `new_program` if explicitly announced
- `new_form_available` if explicitly announced

### 8.2 Chapter-Head Notification Types
- `opportunity_approved`
- `new_opportunity_application`
- `announcement_chapter_head`
- `announcement_all`

### 8.3 Admin Notification Types
- `opportunity_approval_required`

## 9. Recommended Workflow Triggers
### 9.1 Chapter Head Submits Opportunity
When a chapter head creates an opportunity with `pending_approval`:

Create notification for admin:
- type: `opportunity_approval_required`
- suggested message: `A new opportunity is waiting for approval.`

### 9.2 Admin Approves Opportunity
When an opportunity changes to `approved`:

Create notification for the chapter head who submitted it:
- type: `opportunity_approved`
- suggested message: `Your opportunity has been approved.`

### 9.3 Member Applies To Opportunity
When a member submits an application/signup:

Create notification for the relevant chapter head:
- type: `new_opportunity_application`
- suggested message: `A new application was received for [Opportunity Name].`

Create notification for the member:
- type: `application_received`
- suggested message: `Your application has been received.`

### 9.4 Admin Creates New Announcement
When admin creates an announcement:
- determine audience
- create notifications for matching users
- include optional link if provided

## 10. Recommendation On Programs And Forms
Do not automatically notify all users every time:
- a program is edited
- a form URL is changed
- site settings are adjusted

Instead:
Let admin explicitly choose to send an announcement when appropriate.

This prevents notification fatigue.

## 11. Recommended UI
All notifications should be in-app first.

Suggested UI elements:
- bell icon in top navigation/header
- unread badge/count
- dropdown preview or dedicated notifications page
- list of recent notifications
- mark as read
- optional mark all as read later

### 11.1 Role-Based Behavior
- public logged-in users can see their notifications in account/header
- chapter heads can see notifications in their staff header/dashboard
- admins can see notifications in their admin header/dashboard

## 12. Recommended UX Principles
Notifications should be:
- short
- understandable
- actionable

Good examples:
- `Your application for Coastal Cleanup was received.`
- `A new opportunity is waiting for approval.`
- `Your opportunity has been approved.`
- `A new application was received for Youth Outreach Drive.`

Each notification should support a relevant destination where possible.

Suggested link targets:
- opportunity page
- admin opportunities area
- chapter-head dashboard
- member account page
- notifications page

## 13. Security Requirements
### 13.1 Notifications Must Not Bypass Access Rules
A notification link must never expose protected content to unauthorized users.

### 13.2 Protected Workflow Notifications Must Use Trusted Logic
Examples:
- opportunity approval notifications
- chapter-head workflow notifications
- member application notifications

### 13.3 Admin Announcements Must Respect Audience Targeting
Do not send chapter-head-only or member-only announcements to the wrong audience.

### 13.4 Read State Must Be User-Specific
One user reading a notification must not affect another user.

## 14. Reliability Requirements
Preserve current platform patterns:
- `withTimeout`
- `aliveRef`
- explicit query states
- honest `loading/error/empty/ready` behavior

Do not let:
- notification fetch failure look like no notifications
- failed notification creation look like success
- announcement failures silently disappear

## 15. Non-Goals For V1
Do not include these unless trivially safe:
- email notifications
- push notifications
- SMS
- real-time sockets first
- full notification preferences system
- audit logs for every notification action
- notification batching or digests
- complex delivery rules

## 16. Open Product Question
Before final implementation, define this clearly:

Who counts as a member user?

Recommended default:
- all authenticated non-staff users

This choice affects announcement fan-out and member notification targeting.

## 17. Recommended Build Order
1. `notifications` table and basic UI
2. automatic workflow notifications
3. admin announcements
4. optional mark-all-as-read and polish
5. optional email later

## 18. Success Criteria
A successful V1 notification system should make this true:
- admins know when a chapter-head-created opportunity needs approval
- chapter heads know when their opportunity is approved
- chapter heads know when a member applies to one of their opportunities
- members know their application was received
- admin can send targeted announcements to members, chapter heads, or both
- notifications are stored, readable, and markable as read
- public and staff UX remains honest and reliable
- security and current route protections remain intact
