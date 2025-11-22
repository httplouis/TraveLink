# TraviLink System Enhancement - Implementation Plan

## Overview
This document outlines the comprehensive system enhancements requested by the user.

## Completed Tasks

### 1. ✅ Database Seeding
- Created `SEED-DRIVERS-VEHICLES.sql` with:
  - 9 drivers from the provided list
  - 15 vehicles with plate numbers, capacities, and coding days
  - Vehicle coding days tracking table
  - Function to check vehicle availability considering coding days

## In Progress / To Do

### 2. Header UI Enhancement
- Enhance TopBar component to prepare for logo integration
- Add logo placeholder/container
- Improve visual design

### 3. Schedule Page Redesign (User View)
- ✅ Removed map component
- Update to show pending requests from the user
- Show only slot availability for other requests (no details)
- Enhance calendar design
- Show user's own pending requests on calendar

### 4. Admin Schedule View
- Full details view for all requests
- Edit functionality (manual and automatic assignment)
- Smart assignment logic (check vehicle/driver availability)
- Prevent assignment if vehicle/driver not available

### 5. Uniform User Views
- Clone faculty view to:
  - Head
  - HR
  - VP
  - President
- Keep inbox pages for approvals
- Maintain signature functionality

### 6. Sidebar Animations
- Apply sidebar animation from user/faculty to:
  - Head
  - HR
  - VP
  - President
- Exclude admin and comptroller

### 7. Notifications
- Ensure all notification systems work
- Fix any broken notification flows
- Test notification delivery

### 8. Signature Settings
- Create settings page for signers
- Allow saving signature
- Apply saved signature when approving

### 9. Request Tracking
- Track all request movements
- Log when requests are:
  - Sent back to user
  - Forwarded to admin
  - Returned to any approver
- Display full request history

### 10. Dashboard Enhancement
- Enhance dashboard for all users (except admin)
- Add vehicle images
- Improve visual design
- Add relevant metrics

### 11. Driver Privacy
- Remove driver avatars from public view
- Keep vehicle images visible

## Technical Notes

### Database Changes
- `vehicle_coding_days` table created
- `is_vehicle_available()` function created
- Drivers and vehicles seeded

### API Endpoints Needed
- `/api/schedule/user-pending` - Get user's pending requests for calendar
- `/api/schedule/admin` - Admin schedule with full details
- `/api/schedule/assign` - Smart assignment endpoint
- `/api/settings/signature` - Save/load signature
- `/api/requests/tracking` - Request movement tracking

### Component Structure
- User Schedule: View-only, shows availability
- Admin Schedule: Full details, editable, smart assignment
- Settings: Signature management
- Dashboard: Enhanced with vehicle images

## Implementation Order
1. Database seeding (✅ Done)
2. Header enhancement
3. User schedule redesign
4. Admin schedule view
5. Uniform views
6. Sidebar animations
7. Notifications
8. Signature settings
9. Request tracking
10. Dashboard enhancement

