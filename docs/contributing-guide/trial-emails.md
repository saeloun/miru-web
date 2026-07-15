# Trial and trial emails (self-hosting notes)

Every new workspace starts a 14-day Pro trial automatically (`Company::TRIAL_LENGTH`).
A daily `TrialEmailsJob` sends the trial lifecycle sequence to workspace owners and
admins: a getting-started email on day 2, a Pro-features email on day 5, and upgrade
reminders 7, 2, and 1 days before the trial ends.

## What a release upgrade requires

- Run `rails db:migrate` (adds `companies.trial_email_last_sent_on`).
- Restart the Solid Queue dispatcher/worker process so it picks up the new
  `trial_emails` recurring task from `config/solid_queue.yml`.
- `APP_BASE_URL` must be set for the email CTA links (already required by other mailers).

## Self-hosted instances

Trial emails only send when Stripe billing is configured. If none of
`STRIPE_PLAN_PAGE_URL`, `STRIPE_SUBSCRIPTION_PRICE_ID`,
`STRIPE_SUBSCRIPTION_PRICE_ID_MONTHLY`, or `STRIPE_SUBSCRIPTION_PRICE_ID_YEARLY`
is set, `TrialEmailsJob` is a no-op — self-hosted instances without a checkout
path never receive upgrade emails.

To exempt workspaces from trials and billing entirely (full Pro access, no emails):

```ruby
# rails console
Company.update_all(billing_exempt: true)
```

## Operational levers

- `TRIAL_EMAILS_CRON` overrides the send schedule (default `0 9 * * *`, UTC) in production.
- Trial day math runs in each company's timezone; the send stamp is
  `companies.trial_email_last_sent_on` (one email per company per day, reminders
  take precedence over onboarding emails, missed reminder runs catch up on the
  next run).
- Each send is logged: `TrialEmailsJob: sent=<email> company=<id> user=<id> days_remaining=<n>`.
- Users who unsubscribed from all emails (`notification_preferences.unsubscribed_from_all`)
  are skipped.
