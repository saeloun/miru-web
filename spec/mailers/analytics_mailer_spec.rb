# frozen_string_literal: true

require "rails_helper"

RSpec.describe AnalyticsMailer, type: :mailer do
  describe "#threshold_alert" do
    let(:company) { create(:company, name: "Acme Analytics") }
    let(:recipient) { create(:user, email: "owner@example.com") }

    it "renders the analytics threshold email" do
      mail = described_class.with(
        company_id: company.id,
        recipient: recipient.email,
        alert: {
          type: "low_utilization",
          title: "Low utilization detected",
          message: "Team utilization is below 60% for the selected period.",
          metadata: { utilization_rate: 55.0 }
        }
      ).threshold_alert

      body = mail.html_part&.body&.decoded || mail.body.decoded

      expect(mail.to).to eq([recipient.email])
      expect(mail.subject).to include("Acme Analytics")
      expect(body).to include("Low utilization detected")
      expect(body).to include("55.0")
      expect(body).to include("View analytics")
    end
  end
end
