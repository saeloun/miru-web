# frozen_string_literal: true

require "rails_helper"

RSpec.describe Analytics::FounderDigestJob do
  let(:metrics) do
    {
      signups: { weeks: [], totals: { companies: 0, users: 0 } },
      activation_funnel: { total: 0, with_client: 0, with_activity: 0, with_invoice: 0, with_payment: 0 },
      weekly_active: { companies: 0, users: 0 },
      trials: { active: 0, ending_within_7_days: 0, expired: 0, converted: 0 },
      checkouts: {
        last_7_days: { started: 0, purchased: 0 },
        last_30_days: { started: 0, purchased: 0 }
      },
      top_workspaces: []
    }
  end

  before do
    allow(ENV).to receive(:[]).and_call_original
    allow(Analytics::GrowthMetricsService).to receive(:process).and_return(metrics)
  end

  it "sends one digest to each configured recipient" do
    allow(ENV).to receive(:[]).with("FOUNDER_DIGEST_EMAILS").and_return("one@example.com, two@example.com")

    expect {
      described_class.perform_now
    }.to have_enqueued_mail(FounderDigestMailer, :weekly).twice

    recipients = enqueued_jobs.filter_map do |job|
      next unless job[:job] == ActionMailer::MailDeliveryJob

      params = job[:args].last.fetch("params")
      params.fetch("recipient")
    end
    expect(recipients).to match_array(["one@example.com", "two@example.com"])
    expect(Analytics::GrowthMetricsService).to have_received(:process).once
  end

  it "falls back to super admin emails when FOUNDER_DIGEST_EMAILS is unset" do
    allow(ENV).to receive(:[]).with("FOUNDER_DIGEST_EMAILS").and_return(nil)
    admin = create(:user, email: User.super_admin_emails.first)
    admin.update!(confirmed_at: Time.current) unless admin.confirmed?

    expect {
      described_class.perform_now
    }.to have_enqueued_mail(FounderDigestMailer, :weekly).once
  end

  it "skips when neither configuration nor super admins provide recipients" do
    allow(ENV).to receive(:[]).with("FOUNDER_DIGEST_EMAILS").and_return(nil)
    allow(User).to receive(:super_admins).and_return(User.none)
    allow(Rails.logger).to receive(:info)

    expect {
      described_class.perform_now
    }.not_to have_enqueued_mail(FounderDigestMailer)

    expect(Rails.logger).to have_received(:info).with("Analytics::FounderDigestJob skipped: no recipients")
    expect(Analytics::GrowthMetricsService).not_to have_received(:process)
  end
end
