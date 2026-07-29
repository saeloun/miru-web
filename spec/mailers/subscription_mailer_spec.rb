# frozen_string_literal: true

require "rails_helper"

RSpec.describe SubscriptionMailer, type: :mailer do
  describe "#trial_started" do
    it "emails the initiating user with the trial end date" do
      company = create(:company, name: "Saeloun Inc")
      user = create(:user, email: "vipul@saeloun.com", first_name: "Vipul")
      trial_end = Time.zone.local(2026, 4, 10, 12, 0, 0)
      company.update!(trial_started_at: trial_end - 30.days, trial_ends_at: trial_end)

      mail = described_class.with(company_id: company.id, recipient_id: user.id).trial_started

      expect(mail.to).to eq(["vipul@saeloun.com"])
      expect(mail.subject).to eq("Your Miru Pro trial is active")
      expect(mail.body.encoded).to include("Saeloun Inc")
      expect(mail.body.encoded).to include("April 10, 2026")
    end

    it "renders when the company timezone is a GMT-formatted label" do
      company = create(:company, name: "Saeloun Inc", timezone: "(GMT-05:00) Eastern Time (US & Canada)")
      user = create(:user, email: "sonam@saeloun.com", first_name: "Sonam")
      trial_end = Time.zone.local(2026, 4, 10, 12, 0, 0)
      company.update!(trial_started_at: trial_end - 30.days, trial_ends_at: trial_end)

      expect do
        mail = described_class.with(company_id: company.id, recipient_id: user.id).trial_started

        expect(mail.subject).to eq("Your Miru Pro trial is active")
        expect(mail.body.encoded).to include("April 10, 2026")
      end.not_to raise_error
    end
  end

  describe "#trial_getting_started" do
    it "emails the recipient a day-two feature tour with the trial end date" do
      company = create(:company, name: "Saeloun Inc")
      user = create(:user, email: "vipul@saeloun.com", first_name: "Vipul")
      trial_end = Time.zone.local(2026, 4, 10, 12, 0, 0)
      company.update!(trial_started_at: trial_end - 14.days, trial_ends_at: trial_end)

      mail = described_class.with(company_id: company.id, recipient_id: user.id).trial_getting_started

      expect(mail.to).to eq(["vipul@saeloun.com"])
      expect(mail.subject).to eq("Make the most of your Miru Pro trial")
      expect(mail.html_part.body.decoded).to include("Saeloun Inc")
      expect(mail.html_part.body.decoded).to include("Track time as you go")
      expect(mail.html_part.body.decoded).to include("Turn hours into invoices")
      expect(mail.html_part.body.decoded).to include("April 10, 2026")
      expect(mail.text_part.body.decoded).to include("Saeloun Inc")
      expect(mail.text_part.body.decoded).to include("April 10, 2026")
    end
  end

  describe "#trial_pro_features" do
    it "emails the recipient the day-five conversion pitch with pricing" do
      company = create(:company, name: "Saeloun Inc")
      user = create(:user, email: "vipul@saeloun.com", first_name: "Vipul")
      trial_end = Time.zone.local(2026, 4, 10, 12, 0, 0)
      company.update!(trial_started_at: trial_end - 14.days, trial_ends_at: trial_end)

      mail = described_class.with(company_id: company.id, recipient_id: user.id).trial_pro_features

      expect(mail.to).to eq(["vipul@saeloun.com"])
      expect(mail.subject).to eq("See what your team keeps with Miru Pro")
      expect(mail.html_part.body.decoded).to include("Saeloun Inc")
      expect(mail.html_part.body.decoded).to include("$1")
      expect(mail.html_part.body.decoded).to include("per team member per month")
      expect(mail.html_part.body.decoded).to include("Upgrade to Pro")
      expect(mail.text_part.body.decoded).to include("Saeloun Inc")
      expect(mail.text_part.body.decoded).to include("$1 per team member per month")
    end
  end

  describe "#trial_ending_reminder" do
    it "emails a day-count reminder asking to upgrade" do
      company = create(:company, name: "Saeloun Inc")
      user = create(:user, email: "vipul@saeloun.com", first_name: "Vipul")
      trial_end = Time.zone.local(2026, 4, 10, 12, 0, 0)
      company.update!(trial_started_at: trial_end - 14.days, trial_ends_at: trial_end)

      mail = described_class.with(
        company_id: company.id,
        recipient_id: user.id,
        days_remaining: 7
      ).trial_ending_reminder

      expect(mail.to).to eq(["vipul@saeloun.com"])
      expect(mail.subject).to eq("Your Miru Pro trial ends in 7 days")
      expect(mail.html_part.body.decoded).to include("Saeloun Inc")
      expect(mail.html_part.body.decoded).to include("ends in 7")
      expect(mail.html_part.body.decoded).to include("Upgrade now")
      expect(mail.html_part.body.decoded).to include("April 10, 2026")
      expect(mail.text_part.body.decoded).to include("ends in 7")
    end

    it "switches to tomorrow wording on the last day" do
      company = create(:company, name: "Saeloun Inc")
      user = create(:user, email: "vipul@saeloun.com", first_name: "Vipul")
      trial_end = Time.zone.local(2026, 4, 10, 12, 0, 0)
      company.update!(trial_started_at: trial_end - 14.days, trial_ends_at: trial_end)

      mail = described_class.with(
        company_id: company.id,
        recipient_id: user.id,
        days_remaining: 1
      ).trial_ending_reminder

      expect(mail.subject).to eq("Your Miru Pro trial ends tomorrow")
      expect(mail.html_part.body.decoded).to include("ends tomorrow")
      expect(mail.text_part.body.decoded).to include("ends tomorrow")
    end
  end

  describe "#trial_expired" do
    it "emails the recipient with the billing URL" do
      company = create(:company, name: "Saeloun Inc")
      user = create(:user, email: "vipul@saeloun.com", first_name: "Vipul")
      allow(ENV).to receive(:[]).and_call_original
      allow(ENV).to receive(:[]).with("APP_BASE_URL").and_return("https://app.miru.so")

      mail = described_class.with(company_id: company.id, recipient_id: user.id).trial_expired

      expect(mail.to).to eq(["vipul@saeloun.com"])
      expect(mail.subject).to eq("Your Miru Pro trial has ended — upgrade to keep your team")
      expect(mail.html_part.body.decoded).to include("https://app.miru.so/settings/billing")
      expect(mail.text_part.body.decoded).to include("https://app.miru.so/settings/billing")
    end
  end

  describe "#plan_purchased" do
    it "emails the configured internal recipient with the purchase details" do
      company = create(:company, name: "Saeloun Inc")

      mail = described_class.with(
        company_id: company.id,
        alert_email: "vipul@saeloun.com",
        plan_label: "Paid",
        stripe_subscription_id: "sub_123",
        subscription_interval: "month",
        seat_quantity: 12,
        billing_url: "https://app.miru.so/settings/billing"
      ).plan_purchased

      expect(mail.to).to eq(["vipul@saeloun.com"])
      expect(mail.subject).to eq("Cha-ching! Saeloun Inc bought Miru Pro")
      expect(mail.html_part.body.decoded).to include("Saeloun Inc")
      expect(mail.html_part.body.decoded).to include("Cha-ching")
      expect(mail.html_part.body.decoded).to include("Miru Pro")
      expect(mail.html_part.body.decoded).to include("month")
      expect(mail.html_part.body.decoded).to include("12")
      expect(mail.html_part.body.decoded).to include("sub_123")
      expect(mail.text_part.body.decoded).to include("Saeloun Inc")
      expect(mail.text_part.body.decoded).to include("CHA-CHING")
      expect(mail.text_part.body.decoded).to include("Miru Pro")
      expect(mail.text_part.body.decoded).to include("month")
      expect(mail.text_part.body.decoded).to include("12")
      expect(mail.text_part.body.decoded).to include("sub_123")
    end
  end
end
