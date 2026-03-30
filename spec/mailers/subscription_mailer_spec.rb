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
end
