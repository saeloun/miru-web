# API Endpoint Fixes Applied

## Issue

The initial test implementation used incorrect API endpoints that don't exist in the Miru application.

## Fixes Applied

### 1. Notification Preferences API

**Incorrect:**
```typescript
GET  /api/v1/team_members/notification_preferences
PUT  /api/v1/team_members/notification_preferences
```

**Correct:**
```typescript
GET  /api/v1/team/:team_id/notification_preferences
PUT  /api/v1/team/:team_id/notification_preferences
```

**Changes Made:**
- Added `getCurrentUserId()` helper to fetch the current user's ID
- Updated `getNotificationPreference()` to use `/api/v1/team/${userId}/notification_preferences`
- Updated `updateNotificationPreference()` to use `/api/v1/team/${userId}/notification_preferences`
- Both functions now automatically fetch the current user ID if not provided

### 2. Timesheet Entries API

**Incorrect:**
```typescript
POST   /api/v1/timesheet_entries
DELETE /api/v1/timesheet_entries/:id
```

**Correct:**
```typescript
POST   /api/v1/timesheet_entry
DELETE /api/v1/timesheet_entry/:id
```

**Changes Made:**
- Updated `createTimesheetEntries()` to use `/api/v1/timesheet_entry` (singular)
- Updated `deleteTimesheetEntriesForWeek()` to use `/api/v1/timesheet_entry/:id` (singular)

## Remaining Issues

### Missing Test Endpoint

The tests expect an endpoint to trigger the weekly reminder job:
```
POST /api/internal/trigger_weekly_reminder
```

**This endpoint needs to be created** as documented in:
- `docs/testing/notification-tests-setup.md`
- `DEVELOPER-CHECKLIST.md`

### Letter Opener Configuration

The tests assume letter_opener is configured for email testing. Ensure:
```ruby
# config/environments/development.rb
config.action_mailer.delivery_method = :letter_opener
config.action_mailer.asset_host = 'http://localhost:3000'
```

## Testing After Fixes

Run the tests again:
```bash
npm run test:e2e:notifications
```

Expected improvements:
- ✅ Notification preference tests should now pass (404 errors fixed)
- ✅ Timesheet entry creation tests should now pass (404 errors fixed)
- ❌ Email-related tests will still fail until:
  - Letter opener is configured
  - Test trigger endpoint is created
  - Actual reminder emails are sent

## Next Steps

1. **Create the test trigger endpoint** (see setup guide)
2. **Configure letter_opener** for email testing
3. **Run tests again** to verify fixes
4. **Adjust selectors** in settings UI tests if needed (based on actual UI structure)

## Files Modified

- `e2e/notifications/helpers.ts` - Fixed API endpoints

## Verification

To verify the correct endpoints exist:
```bash
rails routes | grep notification_preferences
rails routes | grep timesheet_entry
```

Should show:
```
GET    /api/v1/team/:team_id/notification_preferences
PUT    /api/v1/team/:team_id/notification_preferences
POST   /api/v1/timesheet_entry
DELETE /api/v1/timesheet_entry/:id
```
