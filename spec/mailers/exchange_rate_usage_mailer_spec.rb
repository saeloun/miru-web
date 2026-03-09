# frozen_string_literal: true

require "rails_helper"

RSpec.describe ExchangeRateUsageMailer, type: :mailer do
  describe "#usage_warning" do
    let(:company) { create(:company) }
    let(:user) { create(:user, current_workspace_id: company.id, first_name: "John") }
    let(:usage) { create(:exchange_rate_usage, requests_count: 750, last_fetched_at: Time.current) }
    let(:mail) { described_class.usage_warning(user, usage) }

    it "renders the subject" do
      expect(mail.subject).to eq("Exchange Rate API Usage Warning - 75.0% Used")
    end

    it "renders the receiver email" do
      expect(mail.to).to eq([user.email])
    end

    it "includes user's first name in body" do
      expect(mail.body.encoded).to include("John")
    end

    it "includes usage percentage in body" do
      expect(mail.body.encoded).to include("75.0%")
    end

    it "includes current usage count in body" do
      expect(mail.body.encoded).to include("750")
    end

    it "includes total limit in body" do
      expect(mail.body.encoded).to include("1000")
    end

    it "includes remaining requests in body" do
      expect(mail.body.encoded).to include("250")
    end

    it "includes month in body" do
      expect(mail.body.encoded).to include(usage.month.strftime("%B %Y"))
    end

    it "includes last updated timestamp in body" do
      expect(mail.body.encoded).to include(usage.last_fetched_at.strftime("%B %d, %Y"))
    end

    context "with HTML format" do
      it "includes warning emoji" do
        expect(mail.html_part.body.encoded).to include("⚠️")
      end

      it "includes styled warning box" do
        expect(mail.html_part.body.encoded).to include("warning-box")
      end

      it "includes stats section" do
        expect(mail.html_part.body.encoded).to include("stats")
      end
    end

    context "with text format" do
      it "includes warning emoji" do
        expect(mail.text_part.body.encoded).to include("⚠️")
      end

      it "includes usage statistics section" do
        expect(mail.text_part.body.encoded).to include("CURRENT USAGE STATISTICS")
      end

      it "includes recommended actions" do
        expect(mail.text_part.body.encoded).to include("RECOMMENDED ACTIONS")
      end
    end
  end
end
