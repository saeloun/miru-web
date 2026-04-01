# frozen_string_literal: true

require "rails_helper"

RSpec.describe MonthlyReportsDeliveryService do
  describe "#process" do
    let(:company) { create(:company) }
    let(:eligible_user) { create(:user, current_workspace: company) }
    let(:disabled_user) { create(:user, current_workspace: company) }
    let(:unsubscribed_user) { create(:user, current_workspace: company) }

    before do
      create(
        :notification_preference,
        user: eligible_user,
        company:,
        monthly_report_digest_enabled: true,
        unsubscribed_from_all: false
      )
      create(
        :notification_preference,
        user: disabled_user,
        company:,
        monthly_report_digest_enabled: false,
        unsubscribed_from_all: false
      )
      create(
        :notification_preference,
        user: unsubscribed_user,
        company:,
        monthly_report_digest_enabled: true,
        unsubscribed_from_all: true
      )
    end

    it "queues monthly digest emails only for opted-in users" do
      ActiveJob::Base.queue_adapter = :test

      expect {
        described_class.new(month: Date.new(2026, 3, 1)).process
      }.to have_enqueued_job.on_queue("default").exactly(:once)
    end
  end
end
