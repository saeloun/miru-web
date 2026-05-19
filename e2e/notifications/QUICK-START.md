# Quick Start - Notification Tests

## 🚀 Run Tests (After Fix)

```bash
# 1. Start dev server
bin/dev

# 2. Run all notification tests
npm run test:e2e:notifications
```

## ✅ Expected Results (After Fix)

### Reminder Logic Tests
- ✅ 45 hours logged → NO reminder
- ✅ 30 hours logged → Reminder sent
- ✅ 40 hours logged → NO reminder
- ✅ 39.5 hours logged → Reminder sent
- ✅ Reminder disabled → NO reminder
- ✅ Timeoff included in calculation

### Email Asset Tests
- ✅ 0 broken images
- ✅ Logo visible
- ✅ Styles applied
- ✅ Absolute URLs used

### Settings UI Tests
- ✅ Page loads
- ✅ Toggle works
- ✅ Settings persist

## 🔧 One-Time Setup

```bash
# 1. Install dependencies
npm install
npx playwright install

# 2. Configure letter_opener (add to config/environments/development.rb)
config.action_mailer.delivery_method = :letter_opener
config.action_mailer.asset_host = 'http://localhost:3000'

# 3. Add test endpoint (app/controllers/api/internal/testing_controller.rb)
# See docs/testing/notification-tests-setup.md for code

# 4. Seed database
rails db:seed
```

## 🐛 Debugging Failed Tests

```bash
# Run in headed mode (see browser)
npx playwright test e2e/notifications --headed

# Run in debug mode (step through)
npx playwright test e2e/notifications --debug

# Check screenshots
ls test-results/

# Check emails manually
open http://localhost:3000/letter_opener
```

## 📚 Full Documentation

- **Setup Guide**: `docs/testing/notification-tests-setup.md`
- **Test Details**: `e2e/notifications/README.md`
- **Bug Report**: `bug-report-timesheet-reminder.md`

## 🆘 Common Issues

### "No projects found"
```bash
rails db:seed
```

### "Email not found"
```bash
# Check letter_opener is configured
open http://localhost:3000/letter_opener
```

### "Endpoint not found"
```bash
# Verify route exists
rails routes | grep trigger_weekly_reminder
```

### Tests are flaky
```bash
# Run serially
npx playwright test e2e/notifications --workers=1
```

## 📝 Manual Verification

```bash
# 1. Create 45 hours of entries for previous week
rails console
> user = User.find_by(email: 'vipul@saeloun.com')
> # Create entries... (see setup guide)

# 2. Trigger reminder
> WeeklyReminderForMissedEntriesService.new.process

# 3. Check letter_opener
open http://localhost:3000/letter_opener
# Should NOT see reminder for user with 45 hours
```

## 🎯 Test Coverage Summary

| Test Category | Test Count | Coverage |
|--------------|------------|----------|
| Reminder Logic | 6 tests | Core bug scenarios |
| Email Assets | 8 tests | Asset loading issues |
| Settings UI | 10 tests | User preferences |
| **Total** | **24 tests** | **Complete coverage** |

## ✨ After Tests Pass

1. ✅ Review test results
2. ✅ Check screenshots
3. ✅ Manual verification on staging
4. ✅ Deploy to production
5. ✅ Monitor for issues
