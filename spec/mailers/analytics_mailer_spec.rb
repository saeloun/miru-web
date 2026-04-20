# frozen_string_literal: true

require "rails_helper"

RSpec.describe AnalyticsMailer, type: :mailer do
  describe "#threshold_alert" do
    let(:company) { create(:company, name: "Acme Analytics") }
    let(:recipient) { create(:user, email: "owner@example.com") }

    it "renders the analytics threshold email" do
      mail = described_class.with(
        company_id: company.id,
        recipients: [recipient.email],
        alert: {
          type: "low_utilization",
          title: "Low utilization detected",
          message: "Team utilization is below 60% for the selected period.",
          metadata: { utilization_rate: 55.0 }
        }
      ).threshold_alert

      expect(mail.to).to eq([recipient.email])
      expect(mail.subject).to include("Acme Analytics")
      expect(mail.body.encoded).to include("Low utilization detected")
      expect(mail.body.encoded).to include("55.0")
    end
  end
end
