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
