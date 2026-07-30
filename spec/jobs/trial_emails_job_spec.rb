# frozen_string_literal: true

require "rails_helper"

RSpec.describe TrialEmailsJob do
  let(:company) { create(:company, plan_tier: "free", billing_exempt: false) }
  let(:owner) { create(:user) }

  before do
    create(:employment, company:, user: owner)
    owner.add_role :owner, company

    allow(ENV).to receive(:[]).and_call_original
    allow(ENV).to receive(:[]).with("STRIPE_SUBSCRIPTION_PRICE_ID").and_return("price_test_123")
  end

  def start_trial(target = company, days_ago:, length: Company::TRIAL_LENGTH)
    started_at = days_ago.days.ago
    target.update!(trial_started_at: started_at, trial_ends_at: started_at + length)
  end

  around do |example|
    travel_to(Time.zone.local(2026, 7, 14, 12, 0, 0)) { example.run }
  end

  it "sends nothing when Stripe billing is not configured" do
    %w[STRIPE_PLAN_PAGE_URL STRIPE_SUBSCRIPTION_PRICE_ID STRIPE_SUBSCRIPTION_PRICE_ID_MONTHLY
       STRIPE_SUBSCRIPTION_PRICE_ID_YEARLY STRIPE_MONTHLY_PRICE_ID STRIPE_YEARLY_PRICE_ID].each do |key|
      allow(ENV).to receive(:[]).with(key).and_return(nil)
    end
    start_trial(days_ago: 2)

    expect { described_class.perform_now }.not_to have_enqueued_mail(SubscriptionMailer)
  end

  it "sends the getting started email when only the Render monthly price is configured" do
    %w[STRIPE_PLAN_PAGE_URL STRIPE_SUBSCRIPTION_PRICE_ID STRIPE_SUBSCRIPTION_PRICE_ID_MONTHLY
       STRIPE_SUBSCRIPTION_PRICE_ID_YEARLY STRIPE_YEARLY_PRICE_ID].each do |key|
      allow(ENV).to receive(:[]).with(key).and_return(nil)
    end
    allow(ENV).to receive(:[]).with("STRIPE_MONTHLY_PRICE_ID").and_return("price_monthly")
    start_trial(days_ago: 2)

    expect { described_class.perform_now }.to have_enqueued_mail(SubscriptionMailer, :trial_getting_started)
      .with(params: { company_id: company.id, recipient_id: owner.id }, args: [])
  end

  it "sends the getting started email on day two of the trial" do
    start_trial(days_ago: 2)

    expect { described_class.perform_now }.to have_enqueued_mail(SubscriptionMailer, :trial_getting_started)
      .with(params: { company_id: company.id, recipient_id: owner.id }, args: [])

    expect(company.reload.trial_email_last_sent_on).to eq(Date.current)
  end

  it "sends the pro features email on day five of the trial" do
    start_trial(days_ago: 5)

    expect { described_class.perform_now }.to have_enqueued_mail(SubscriptionMailer, :trial_pro_features)
      .with(params: { company_id: company.id, recipient_id: owner.id }, args: [])
  end

  [7, 2, 1].each do |days_remaining|
    it "sends the ending reminder #{days_remaining} day(s) before the trial ends" do
      start_trial(days_ago: 14 - days_remaining)

      expect { described_class.perform_now }.to have_enqueued_mail(SubscriptionMailer, :trial_ending_reminder)
        .with(
          params: { company_id: company.id, recipient_id: owner.id, days_remaining: },
          args: []
        )
    end
  end

  it "catches up on a missed reminder run instead of dropping it" do
    start_trial(days_ago: 8)
    company.update!(trial_email_last_sent_on: 3.days.ago.to_date)

    expect { described_class.perform_now }.to have_enqueued_mail(SubscriptionMailer, :trial_ending_reminder)
      .with(
        params: { company_id: company.id, recipient_id: owner.id, days_remaining: 6 },
        args: []
      )
  end

  it "does not repeat a reminder threshold that is already covered" do
    start_trial(days_ago: 8)
    company.update!(trial_email_last_sent_on: 1.day.ago.to_date)

    expect { described_class.perform_now }.not_to have_enqueued_mail(SubscriptionMailer)
  end

  it "sends reminders for legacy 30-day trials but skips their onboarding days" do
    start_trial(days_ago: 23, length: 30.days)

    expect { described_class.perform_now }.to have_enqueued_mail(SubscriptionMailer, :trial_ending_reminder)
      .with(
        params: { company_id: company.id, recipient_id: owner.id, days_remaining: 7 },
        args: []
      )
  end

  it "sends nothing on days with no scheduled email" do
    start_trial(days_ago: 3)

    expect { described_class.perform_now }.not_to have_enqueued_mail(SubscriptionMailer)
  end

  it "sends nothing when the trial has already ended" do
    start_trial(days_ago: 20)

    expect { described_class.perform_now }.not_to have_enqueued_mail(SubscriptionMailer)
  end

  it "sends the expired email for a trial that ended within three days" do
    start_trial(days_ago: 15)

    expect { described_class.perform_now }.to have_enqueued_mail(SubscriptionMailer, :trial_expired)
      .with(params: { company_id: company.id, recipient_id: owner.id }, args: [])

    expect(company.reload.trial_expired_email_sent_at).to eq(Time.current)
  end

  it "sends the expired email only once across repeated runs" do
    start_trial(days_ago: 15)

    expect do
      described_class.perform_now
      described_class.perform_now
    end.to have_enqueued_mail(SubscriptionMailer, :trial_expired).exactly(:once)
  end

  it "does not stamp the marker when there are no eligible recipients so it can retry" do
    start_trial(days_ago: 15)
    create(:notification_preference, company:, user: owner, unsubscribed_from_all: true)

    expect { described_class.perform_now }.not_to have_enqueued_mail(SubscriptionMailer, :trial_expired)
    expect(company.reload.trial_expired_email_sent_at).to be_nil
  end

  it "does not send the expired email to a paid company" do
    start_trial(days_ago: 15)
    company.update!(plan_tier: "paid")

    expect { described_class.perform_now }.not_to have_enqueued_mail(SubscriptionMailer, :trial_expired)
  end

  it "does not send the expired email when the trial ended more than three days ago" do
    start_trial(days_ago: 18)

    expect { described_class.perform_now }.not_to have_enqueued_mail(SubscriptionMailer, :trial_expired)
  end

  it "does not send the expired email when Stripe billing is not configured" do
    %w[STRIPE_PLAN_PAGE_URL STRIPE_SUBSCRIPTION_PRICE_ID STRIPE_SUBSCRIPTION_PRICE_ID_MONTHLY
       STRIPE_SUBSCRIPTION_PRICE_ID_YEARLY STRIPE_MONTHLY_PRICE_ID STRIPE_YEARLY_PRICE_ID].each do |key|
      allow(ENV).to receive(:[]).with(key).and_return(nil)
    end
    start_trial(days_ago: 15)

    expect { described_class.perform_now }.not_to have_enqueued_mail(SubscriptionMailer, :trial_expired)
  end

  it "sends at most one email per company per day across repeated runs" do
    start_trial(days_ago: 2)

    expect do
      described_class.perform_now
      described_class.perform_now
    end.to have_enqueued_mail(SubscriptionMailer, :trial_getting_started).exactly(:once)
  end

  it "isolates a failing company so the rest of the batch still sends" do
    other_company = create(:company, plan_tier: "free", billing_exempt: false)
    other_owner = create(:user)
    create(:employment, company: other_company, user: other_owner)
    other_owner.add_role :owner, other_company

    start_trial(days_ago: 2)
    start_trial(other_company, days_ago: 2)

    allow(SubscriptionMailer).to receive(:with).and_wrap_original do |original, **kwargs|
      raise "boom" if kwargs[:company_id] == company.id

      original.call(**kwargs)
    end

    expect { described_class.perform_now }.to have_enqueued_mail(SubscriptionMailer, :trial_getting_started)
      .with(params: { company_id: other_company.id, recipient_id: other_owner.id }, args: [])
  end

  it "skips paid and billing exempt companies" do
    start_trial(days_ago: 7)
    company.update!(plan_tier: "paid")

    expect { described_class.perform_now }.not_to have_enqueued_mail(SubscriptionMailer)

    company.update!(plan_tier: "free", billing_exempt: true)

    expect { described_class.perform_now }.not_to have_enqueued_mail(SubscriptionMailer)
  end

  it "emails admins but not employees or clients" do
    admin = create(:user)
    create(:employment, company:, user: admin)
    admin.add_role :admin, company

    employee = create(:user)
    create(:employment, company:, user: employee)
    employee.add_role :employee, company

    start_trial(days_ago: 2)

    expect { described_class.perform_now }
      .to have_enqueued_mail(SubscriptionMailer, :trial_getting_started).exactly(2).times
  end

  it "skips recipients who unsubscribed from all emails" do
    NotificationPreference.find_or_create_by!(user_id: owner.id, company_id: company.id)
      .update!(unsubscribed_from_all: true)
    start_trial(days_ago: 2)

    expect { described_class.perform_now }.not_to have_enqueued_mail(SubscriptionMailer)
  end

  it "computes trial days in the company's timezone" do
    travel_to(Time.utc(2026, 7, 14, 23, 0, 0))
    company.update!(timezone: "Auckland")
    company.update!(
      trial_started_at: Time.utc(2026, 7, 8, 6, 0, 0),
      trial_ends_at: Time.utc(2026, 7, 22, 6, 0, 0)
    )

    expect { described_class.perform_now }.to have_enqueued_mail(SubscriptionMailer, :trial_ending_reminder)
      .with(
        params: { company_id: company.id, recipient_id: owner.id, days_remaining: 7 },
        args: []
      )

    expect(company.reload.trial_email_last_sent_on).to eq(Date.new(2026, 7, 15))
  end
end
