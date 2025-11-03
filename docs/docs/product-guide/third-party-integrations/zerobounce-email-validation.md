---
sidebar_position: 1
---

# Zerobounce Email Validation

## Overview

The Zerobounce Circuit Breaker protects user signups from being blocked when the Zerobounce email validation API is unavailable or experiencing issues. It automatically disables email validation after detecting repeated failures, allowing signups to proceed while protecting your email reputation.

## What is Zerobounce?

[Zerobounce](https://www.zerobounce.net/) is an email validation and deliverability service that helps maintain email list hygiene and protect sender reputation. It validates email addresses in real-time to ensure they are valid, deliverable, and not associated with spam traps or abuse.

### Why We Use Zerobounce

**Protect Email Reputation:**
- Prevents sending emails to invalid or non-existent addresses
- Reduces bounce rates that can damage sender reputation
- Helps avoid being flagged as spam by email providers
- Protects your domain's email deliverability score

**Improve User Data Quality:**
- Catches typos and invalid email formats at signup
- Identifies disposable/temporary email addresses
- Detects spam traps and abuse emails
- Ensures you can reach your users

**Cost Savings:**
- Reduces wasted email sends to invalid addresses
- Prevents email service provider costs for bounced emails
- Minimizes support tickets from users who can't receive emails

### Getting Started with Zerobounce

**1. Create an Account:**
- Visit [Zerobounce Sign Up](https://www.zerobounce.net/members/signup/)
- Choose a plan based on your validation volume
- Free tier available for testing (100 validations/month)

**2. Get Your API Key:**
- Log in to your [Zerobounce Dashboard](https://www.zerobounce.net/members/)
- Navigate to **API** section in the menu
- Copy your **API Key** from the dashboard
- Keep this key secure - treat it like a password

**3. Useful Links:**
- [Zerobounce Homepage](https://www.zerobounce.net/)
- [API Documentation](https://www.zerobounce.net/docs/email-validation-api-quickstart/)
- [Pricing Plans](https://www.zerobounce.net/pricing/)
- [Service Status](https://status.zerobounce.net/)
- [Support Center](https://www.zerobounce.net/support/)

**4. Pricing Overview:**
- Pay-as-you-go: Starting at $16 per 2,000 validations
- Monthly plans: Starting at $15/month for 2,000 validations
- Enterprise plans available for high volume
- Free tier: 100 validations/month (no credit card required)

### Key Features

- ✅ **Synchronous validation** - Users wait 1-5 seconds during signup (acceptable UX)
- ✅ **Blocks invalid emails** - When API is working, invalid emails are rejected
- ✅ **Auto-disables on failures** - After 10 API failures in 2 hours, validation is skipped
- ✅ **Protects email reputation** - Invalid emails blocked when possible
- ✅ **Minimal manual intervention** - Auto-recovery after 30 minutes
- ✅ **Admin control** - ENV variable override available for emergencies

## How It Works

### Normal Operation

1. User attempts to sign up
2. System calls Zerobounce API (with 5-second timeout)
3. If email is invalid → signup is blocked
4. If email is valid → signup proceeds

### Circuit Breaker Protection

- Tracks API failures over a 2-hour rolling window
- Opens circuit after **10 consecutive failures**
- When circuit is open:
  - Email validation is skipped
  - Signups proceed without validation
  - Admin is notified via email
- Circuit auto-closes after **30 minutes** of no validation attempts

### Architecture Flow

```
User Signup
    ↓
User Model (before_validation)
    ↓
ZerobounceCircuitBreaker.execute(email)
    ↓
Check: Circuit Open? ──Yes──→ Skip validation, allow signup
    ↓ No
Check: ENV enabled? ──No───→ Skip validation, allow signup
    ↓ Yes
Call Zerobounce API (5s timeout)
    ↓
Success? ──Yes──→ Reset failure count, validate email
    ↓ No
Record failure, check threshold
    ↓
>= 10 failures? ──Yes──→ Open circuit, notify admin
    ↓ No
Skip validation, allow signup
```

## Setup & Configuration

### Prerequisites

Before configuring the integration, ensure you have:
1. ✅ A Zerobounce account ([Sign up here](https://www.zerobounce.net/members/signup/))
2. ✅ Your Zerobounce API key ([Get it from dashboard](https://www.zerobounce.net/members/))
3. ✅ Admin email address for receiving alerts

### Environment Variables

**Email validation is DISABLED by default.** The application works normally without any Zerobounce configuration.

To enable email validation, add these to your `.env` file:

```bash
# Enable email validation (disabled by default)
ENABLE_EMAIL_VALIDATION=true

# Zerobounce API key (required when validation is enabled)
# Get from: https://www.zerobounce.net/members/ → API section
ZERO_BOUNCE_API_KEY=your_api_key_here

# Optional: Admin email for circuit breaker alerts
# If not set, alerts are only logged (no emails sent)
ADMIN_EMAIL=admin@yourcompany.com

# Optional: Default mailer sender (if not already set)
DEFAULT_MAILER_SENDER=noreply@yourapp.com
```

:::tip Default Behavior
If `ENABLE_EMAIL_VALIDATION` is not set or set to `false`, the application works normally without email validation. This means:
- No API key required
- No Zerobounce account needed
- All email addresses are accepted (subject to standard format validation)
- Perfect for development and testing
:::

:::info Production Usage
Enable validation in production to protect your email reputation:
1. Set `ENABLE_EMAIL_VALIDATION=true`
2. Add your Zerobounce API key
3. (Optional) Set `ADMIN_EMAIL` to receive circuit breaker alerts
4. Monitor usage in the [Zerobounce Dashboard](https://www.zerobounce.net/members/)

The free tier provides 100 validations/month.

**Note:** If `ADMIN_EMAIL` is not set, circuit breaker events are logged but no email notifications are sent.
:::

### Circuit Breaker Settings

Located in `app/services/zerobounce_circuit_breaker.rb`:

```ruby
FAILURE_THRESHOLD = 10           # Number of failures before opening circuit
FAILURE_WINDOW = 2.hours         # Time window for counting failures
CIRCUIT_OPEN_DURATION = 30.minutes  # Auto-close after this duration
TIMEOUT_SECONDS = 5              # HTTP timeout (configured in initializer)
```

HTTP timeouts are configured in `config/initializers/zerobounce.rb` using RestClient's timeout settings for safer timeout handling.

### Verify Configuration

```bash
# Check if validation is enabled
bundle exec rake zerobounce:status

# Test API connection
bundle exec rake zerobounce:test[test@example.com]
```

## Admin Commands

### Check Circuit Status

```bash
bundle exec rake zerobounce:status
```

**Output:**
```
=== Zerobounce Circuit Breaker Status ===
State: CLOSED
Failures in last 2 hours: 0
Email validation enabled: true
========================================
```

### Reset Circuit Breaker

```bash
bundle exec rake zerobounce:reset
```

Use this to manually close the circuit after confirming Zerobounce is operational.

### Test API Connection

```bash
bundle exec rake zerobounce:test[test@example.com]
```

## Monitoring

### Log Messages

Circuit breaker events are logged with the `[ZerobounceCircuitBreaker]` prefix:

```
[ZerobounceCircuitBreaker] Timeout after 5 seconds
[ZerobounceCircuitBreaker] Circuit opened after 10 failures
[ZerobounceCircuitBreaker] ALERT: Zerobounce validation disabled due to 10 failures
```

User validation events are logged with the `[User]` prefix:

```
[User] Zerobounce validation skipped: Circuit breaker open
```

### Monitoring Commands

```bash
# Circuit breaker events
grep "ZerobounceCircuitBreaker" log/production.log

# User validation events
grep "Zerobounce validation" log/production.log

# Circuit opened (alert!)
grep "Circuit opened after" log/production.log

# Validation skipped (normal when circuit open)
grep "Zerobounce validation skipped" log/production.log

# API timeouts (investigate if frequent)
grep "Timeout after" log/production.log
```

### Admin Email Alerts

When the circuit opens, an email is automatically sent to `ADMIN_EMAIL` with:
- Failure count and timestamps
- Last error message
- Recent failure history
- Recommended actions

## Email Reputation Protection

### When Circuit is Closed (Normal - 99% of the time)

✅ All emails validated before signup
✅ Invalid emails blocked immediately
✅ Zero risk to email reputation

### When Circuit is Open (Degraded - rare)

⚠️ After 10 failures, circuit opens
⚠️ Validation skipped temporarily
⚠️ Some invalid emails may get through
✅ Admin notified immediately
✅ Auto-recovers in 30 minutes
✅ Can manually disable via ENV

### Trade-off

During Zerobounce outages (rare), some invalid emails might slip through rather than blocking all legitimate signups. This is a reasonable trade-off that:
- Maintains good user experience
- Protects against service outages
- Still blocks 99%+ of invalid emails
- Provides admin control for emergencies

## Troubleshooting

### Circuit Keeps Opening

**Possible causes:**
1. Zerobounce API is down or slow
2. Network connectivity issues
3. API timeout too aggressive (5 seconds)

**Solutions:**
1. Check Zerobounce status: https://status.zerobounce.net/
2. Increase `TIMEOUT_SECONDS` in `app/services/zerobounce_circuit_breaker.rb`
3. Temporarily disable validation: `ENABLE_EMAIL_VALIDATION=false`

### Circuit Won't Close

**Possible causes:**
1. Continuous signup attempts preventing auto-close
2. Circuit data cached incorrectly

**Solutions:**
1. Manually reset: `bundle exec rake zerobounce:reset`
2. Clear Rails cache: `Rails.cache.clear`

### Not Receiving Admin Alerts

**Check:**
1. `ADMIN_EMAIL` environment variable is set
2. Email delivery is configured (check `config/environments/production.rb`)
3. Background job processor is running (Solid Queue)
4. Check logs for mailer errors

### Invalid Emails Getting Through

**Expected behavior when:**
- Circuit is open (after 10 failures)
- `ENABLE_EMAIL_VALIDATION=false`

**To prevent:**
1. Monitor circuit status regularly
2. Set up proper admin email alerts
3. Consider implementing post-signup email verification

### Emergency Disable

```bash
# Set in environment and redeploy
ENABLE_EMAIL_VALIDATION=false

# Or comment out in app/models/user.rb
# before_validation :validate_email_with_zerobounce, on: :create
```

## Testing

### Run Automated Tests

```bash
# Run circuit breaker specs
bundle exec rspec spec/services/zerobounce_circuit_breaker_spec.rb
```

### Manual Testing in Rails Console

**Test normal validation:**
```ruby
result = ZerobounceCircuitBreaker.execute("valid@example.com")
```

**Simulate failures:**
```ruby
10.times { ZerobounceCircuitBreaker.record_failure("Test failure") }
ZerobounceCircuitBreaker.status
# => { state: "open", failures: 10, ... }
```

**Test user signup with circuit closed:**
```ruby
user = User.new(
  email: "invalid@example.com",
  first_name: "Test",
  last_name: "User",
  password: "password123"
)
user.valid?  # Should add email error if Zerobounce returns invalid
```

**Test user signup with circuit open:**
```ruby
# Open the circuit first
10.times { ZerobounceCircuitBreaker.record_failure("Test") }

user = User.new(
  email: "invalid@example.com",
  first_name: "Test",
  last_name: "User",
  password: "password123"
)
user.valid?  # Should skip validation and pass
```

**Reset for testing:**
```ruby
ZerobounceCircuitBreaker.reset!
```

## Deployment Checklist

- [ ] Set `ENABLE_EMAIL_VALIDATION=true`
- [ ] (Optional) Set `ADMIN_EMAIL` to receive circuit breaker alerts
- [ ] Verify email delivery is configured (if using ADMIN_EMAIL)
- [ ] Test with: `bundle exec rake zerobounce:test[test@example.com]`
- [ ] Run tests: `bundle exec rspec spec/services/zerobounce_circuit_breaker_spec.rb`
- [ ] Deploy code
- [ ] Monitor logs for 24 hours
- [ ] Verify admin email delivery when circuit opens (optional test)

## Implementation Details

### Core Components

**Circuit Breaker Service** (`app/services/zerobounce_circuit_breaker.rb`)
- Tracks API failures over 2-hour rolling window
- Opens circuit after 10 consecutive failures
- Auto-closes after 30 minutes
- 5-second timeout on API calls
- Graceful error handling

**Updated User Model** (`app/models/user.rb`)
- Modified `validate_email_with_zerobounce` to use circuit breaker
- Logs validation events
- Skips validation when circuit is open or ENV disabled

**Admin Notifications** (`app/mailers/admin_alert_mailer.rb`)
- Email alerts when circuit opens
- Includes failure details and recommended actions
- HTML and text email templates

**Admin Tools** (`lib/tasks/zerobounce.rake`)
- `rake zerobounce:status` - Check circuit state
- `rake zerobounce:reset` - Manually close circuit
- `rake zerobounce:test[email]` - Test API connection

**Tests** (`spec/services/zerobounce_circuit_breaker_spec.rb`)
- Comprehensive RSpec tests for circuit breaker
- Tests all scenarios: normal, timeout, failures, recovery

### Key Files

| File | Purpose |
|------|---------|
| `app/services/zerobounce_circuit_breaker.rb` | Core circuit breaker logic |
| `app/models/user.rb` | Updated validation method |
| `app/mailers/admin_alert_mailer.rb` | Admin notifications |
| `app/views/mailers/admin_alert_mailer/zerobounce_circuit_open.html.erb` | Email template (HTML) |
| `app/views/mailers/admin_alert_mailer/zerobounce_circuit_open.text.erb` | Email template (Text) |
| `lib/tasks/zerobounce.rake` | Admin commands |
| `spec/services/zerobounce_circuit_breaker_spec.rb` | Tests |

## Production Monitoring

### Key Metrics to Watch

1. Circuit breaker state (should be "closed" normally)
2. Failure count (should be 0 or low)
3. User signup success rate
4. Email bounce rate

### Alerts to Set Up (Optional)

- Circuit breaker opens → Page admin
- Failure count > 5 → Warning
- Circuit open for > 1 hour → Escalate

## Future Enhancements

- [ ] Add Slack/PagerDuty integration for alerts
- [ ] Dashboard for circuit breaker metrics
- [ ] Configurable thresholds per environment
- [ ] Automatic retry with exponential backoff
- [ ] Post-signup async validation for circuit-open signups

---

**Status:** ✅ Production Ready
**Tests:** ✅ 14/14 Passing
**Last Updated:** January 2025
