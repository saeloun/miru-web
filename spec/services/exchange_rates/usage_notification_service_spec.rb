# frozen_string_literal: true

require "rails_helper"

RSpec.describe ExchangeRates::UsageNotificationService, type: :service do
  let(:usage) { create(:exchange_rate_usage, requests_count: 750) }
  let(:service) { described_class.new(usage) }

  describe "#notify_admins" do
    let(:company) { create(:company) }
    let!(:owner) { create(:user, current_workspace_id: company.id).tap { |u| u.add_role(:owner, company) } }
    let!(:admin) { create(:user, current_workspace_id: company.id).tap { |u| u.add_role(:admin, company) } }
    let!(:employee) { create(:user, current_workspace_id: company.id).tap { |u| u.add_role(:employee, company) } }

    it "sends email to owner users" do
      expect {
        service.notify_admins
      }.to have_enqueued_mail(ExchangeRateUsageMailer, :usage_warning).with(owner, usage)
    end

    it "sends email to admin users" do
      expect {
        service.notify_admins
      }.to have_enqueued_mail(ExchangeRateUsageMailer, :usage_warning).with(admin, usage)
    end

    it "does not send email to non-admin users" do
      expect {
        service.notify_admins
      }.not_to have_enqueued_mail(ExchangeRateUsageMailer, :usage_warning).with(employee, usage)
    end

    it "logs a warning" do
      allow(Rails.logger).to receive(:warn)
      service.notify_admins
      expect(Rails.logger).to have_received(:warn).with(/Exchange Rate API Usage Warning/)
    end

    it "includes usage percentage in log" do
      allow(Rails.logger).to receive(:warn)
      service.notify_admins
      expect(Rails.logger).to have_received(:warn).with(/75.0%/)
    end

    it "includes request count in log" do
      allow(Rails.logger).to receive(:warn)
      service.notify_admins
      expect(Rails.logger).to have_received(:warn).with(/750\/1000/)
    end
  end
end
