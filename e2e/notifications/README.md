# Notification E2E Tests

Comprehensive Playwright tests for the weekly timesheet reminder system and email asset loading.

## Test Coverage

### 1. Weekly Reminder Logic Tests (`01-weekly-reminder-logic.spec.ts`)

Tests the core bug where users receive reminder emails despite having 40+ hours logged.

**Test Scenarios:**
- ✅ User with 45 hours logged should NOT receive reminder
- ✅ User with 30 hours logged SHOULD receive reminder
- ✅ User with exactly 40 hours should NOT receive reminder
- ✅ User with reminder disabled should NOT receive email even with 0 hours
- ✅ Reminder includes timeoff entries in total hours calculation
- ✅ Edge case: User with 39.5 hours should receive reminder

### 2. Email Assets Tests (`02-email-assets.spec.ts`)

Tests that email assets (images, logos, styles) load correctly in all emails.

**Test Scenarios:**
- ✅ Weekly reminder email has all images loading correctly
- ✅ Email logo is visible and not broken
- ✅ Email has proper styling applied
- ✅ Email uses absolute URLs for images (not relative paths)
- ✅ Invoice email also has working assets (shared template test)
- ✅ Invitation email has working assets (shared template test)
- ✅ Email header and footer assets load correctly
- ✅ Email renders correctly in different viewport sizes

### 3. Notification Settings UI Tests (`03-notification-settings.spec.ts`)

Tests the notification preferences page functionality.

**Test Scenarios:**
- ✅ Notification settings page loads successfully
- ✅ Weekly timesheet reminder toggle is visible and functional
- ✅ Settings persist after page reload
- ✅ Settings show description text
- ✅ Other notification preferences are visible
- ✅ Admin vs employee permission checks
- ✅ Toggle shows success feedback
- ✅ Keyboard navigation accessibility
- ✅ Unsubscribe from all notifications option

### 4. Weekly Reminder Email Delivery Tests (`04-weekly-reminder-delivery.spec.ts`)

Tests the browser-visible reminder email flow end to end.

**Test Scenarios:**
- ✅ Users below the weekly threshold receive the reminder email
- ✅ Users at or above the weekly threshold do not receive the reminder email
- ✅ Reminder email opens correctly in Letter Opener

## Running the Tests

### Run all notification tests:
```bash
npm run test:e2e:notifications
```

### Run specific test file:
```bash
npx playwright test e2e/notifications/01-weekly-reminder-logic.spec.ts
```

### Run in headed mode (see browser):
```bash
npx playwright test e2e/notifications --headed
```

### Run with UI mode (interactive):
```bash
npx playwright test e2e/notifications --ui
```

### Debug a specific test:
```bash
npx playwright test e2e/notifications/01-weekly-reminder-logic.spec.ts --debug
```

## Prerequisites

### 1. Development Server Running
Ensure the Rails server is running on `http://127.0.0.1:3000`:
```bash
bin/dev
```

### 2. Test Database Seeded
The tests expect seed data to be present:
```bash
rails db:seed
```

### 3. Letter Opener Enabled
For email testing, ensure letter_opener is configured in development:
```ruby
# config/environments/development.rb
config.action_mailer.delivery_method = :letter_opener
config.action_mailer.perform_deliveries = true
```

### 4. Weekly Reminder Job Endpoint
The tests assume an internal API endpoint exists to trigger the reminder job:
```ruby
# config/routes.rb (for testing only)
namespace :api do
  namespace :internal do
    post 'trigger_weekly_reminder', to: 'testing#trigger_weekly_reminder'
  end
end
```

**Note:** This endpoint should only be available in development/test environments.

## Test Data Setup

The tests automatically:
1. Clean up existing timesheet entries for the test week
2. Create timesheet entries with specific durations
3. Enable/disable notification preferences as needed
4. Trigger the reminder job
5. Verify email delivery via letter_opener

## Important Notes

### Email Testing Approach

These tests use **letter_opener** to verify email delivery. In production, you might use:
- **Mailcatcher** - SMTP server for testing
- **Mailtrap** - Email testing service
- **ActionMailer::Base.deliveries** - In-memory email queue (test env only)

### API Endpoint for Triggering Reminders

The tests call `/api/internal/trigger_weekly_reminder` to manually trigger the reminder job. You'll need to implement this endpoint:

```ruby
# app/controllers/api/internal/testing_controller.rb
module Api
  module Internal
    class TestingController < ApplicationController
      # Only allow in development/test
      before_action :ensure_test_environment

      def trigger_weekly_reminder
        WeeklyReminderForMissedEntriesService.new.process
        render json: { success: true }
      end

      private

      def ensure_test_environment
        unless Rails.env.development? || Rails.env.test?
          render json: { error: 'Not available' }, status: :forbidden
        end
      end
    end
  end
end
```

### Time Zone Considerations

The tests use `getPreviousWeekDates()` helper which calculates the previous week's Monday-Sunday range. Ensure your test environment uses the correct time zone:

```ruby
# config/application.rb
config.time_zone = 'UTC' # or your preferred timezone
```

## Debugging Failed Tests

### 1. Check Screenshots
Failed tests automatically capture screenshots:
```
test-results/
  notifications-01-weekly-reminder-logic-spec-ts-*.png
```

### 2. View Traces
Playwright captures traces on failure:
```bash
npx playwright show-trace test-results/trace.zip
```

### 3. Check Letter Opener
Manually navigate to `http://127.0.0.1:3000/letter_opener` to see sent emails.

### 4. Check Logs
Review Rails logs for errors:
```bash
tail -f log/development.log
```

### 5. Verify API Responses
Use the Playwright inspector to see API responses:
```bash
npx playwright test --debug
```

## Known Limitations

1. **Email Asset Testing**: The asset loading tests assume letter_opener renders emails in an iframe. If using a different email testing tool, you may need to adjust the selectors.

2. **Timing Issues**: Email delivery and processing may have slight delays. Tests include appropriate waits, but you may need to adjust timeouts for slower environments.

3. **Test Isolation**: Tests clean up their own data, but running tests in parallel may cause conflicts. Consider running notification tests serially:
   ```bash
   npx playwright test e2e/notifications --workers=1
   ```

## Contributing

When adding new notification tests:

1. Follow the existing naming convention: `##-descriptive-name.spec.ts`
2. Add helper functions to `helpers.ts` for reusability
3. Include clear test descriptions and comments
4. Clean up test data in `beforeEach` or `afterEach` hooks
5. Update this README with new test scenarios

## Related Documentation

- [Playwright Documentation](https://playwright.dev/)
- [Testing Guide](../../docs/ai/testing.md)
- [Bug Report](../../bug-report-timesheet-reminder.md)
- [Weekly Reminder Service](../../app/services/weekly_reminder_for_missed_entries_service.rb)
