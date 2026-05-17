# frozen_string_literal: true

require "rails_helper"

RSpec.describe Analytics::ThresholdNotificationsJob, type: :job do
  let(:company) { create(:company) }
  let(:owner) { create(:user, current_workspace_id: company.id, email: "owner@example.com") }
  let(:admin) { create(:user, current_workspace_id: company.id, email: "admin@example.com") }
  let(:employee) { create(:user, current_workspace_id: company.id, email: "employee@example.com") }

  before do
    create(:employment, company:, user: owner)
    create(:employment, company:, user: admin)
    create(:employment, company:, user: employee)
    owner.add_role :owner, company
    admin.add_role :admin, company
    employee.add_role :employee, company
    enable_analytics_threshold_notifications_for(owner)
    enable_analytics_threshold_notifications_for(admin)
    enable_analytics_threshold_notifications_for(employee)
    Rails.cache.clear
    AnalyticsThresholdNotificationLog.delete_all
    clear_enqueued_jobs
  end

  it "sends threshold alert emails to financial recipients" do
    allow(Analytics::ThresholdEvaluator).to receive(:process).and_return([
      { type: "low_utilization", title: "Low utilization detected", message: "Alert", metadata: {} }
    ])

    expect {
      described_class.perform_now([company.id])
    }.to have_enqueued_mail(AnalyticsMailer, :threshold_alert).twice
  end

  it "does not notify employees" do
    allow(Analytics::ThresholdEvaluator).to receive(:process).and_return([
      { type: "low_utilization", title: "Low utilization detected", message: "Alert", metadata: {} }
    ])

    described_class.perform_now([company.id])

    recipients = enqueued_jobs.map do |job|
      params = job[:args].last["params"] || job[:args].last[:params]
      params["recipient"] || params[:recipient]
    end

    expect(recipients).to match_array([owner.email, admin.email])
  end

  it "does not notify financial recipients who have not opted into analytics digests" do
    disable_analytics_threshold_notifications_for(owner)
    disable_analytics_threshold_notifications_for(admin)

    allow(Analytics::ThresholdEvaluator).to receive(:process).and_return([
      { type: "low_utilization", title: "Low utilization detected", message: "Alert", metadata: {} }
    ])

    expect {
      described_class.perform_now([company.id])
    }.not_to have_enqueued_mail(AnalyticsMailer, :threshold_alert)
  end

  it "does not notify financial recipients without a notification preference" do
    company.notification_preferences.where(user_id: [owner.id, admin.id]).destroy_all

    allow(Analytics::ThresholdEvaluator).to receive(:process).and_return([
      { type: "low_utilization", title: "Low utilization detected", message: "Alert", metadata: {} }
    ])

    expect {
      described_class.perform_now([company.id])
    }.not_to have_enqueued_mail(AnalyticsMailer, :threshold_alert)
  end

  it "does not resend the same alert within the anti-spam window" do
    allow(Analytics::ThresholdEvaluator).to receive(:process).and_return([
      { type: "low_utilization", title: "Low utilization detected", message: "Alert", metadata: {} }
    ])

    expect {
      described_class.perform_now([company.id])
      described_class.perform_now([company.id])
    }.to have_enqueued_mail(AnalyticsMailer, :threshold_alert).twice
  end

  it "resends the same alert after one week" do
    allow(Analytics::ThresholdEvaluator).to receive(:process).and_return([
      { type: "low_utilization", title: "Low utilization detected", message: "Alert", metadata: {} }
    ])

    travel_to Time.zone.local(2026, 5, 4, 10, 0, 0) do
      expect {
        described_class.perform_now([company.id])
        travel 1.week + 1.minute
        described_class.perform_now([company.id])
      }.to have_enqueued_mail(AnalyticsMailer, :threshold_alert).exactly(4).times
    end
  end

  it "records an atomic notification claim" do
    allow(Analytics::ThresholdEvaluator).to receive(:process).and_return([
      { type: "low_utilization", title: "Low utilization detected", message: "Alert", metadata: {} }
    ])

    expect {
      described_class.perform_now([company.id])
    }.to change(AnalyticsThresholdNotificationLog, :count).by(1)

    log = AnalyticsThresholdNotificationLog.last
    expect(log.company_id).to eq(company.id)
    expect(log.alert_type).to eq("low_utilization")
  end

  it "does not notify when there are no alerts" do
    allow(Analytics::ThresholdEvaluator).to receive(:process).and_return([])

    expect {
      described_class.perform_now([company.id])
    }.not_to have_enqueued_mail(AnalyticsMailer, :threshold_alert)
  end

  def enable_analytics_threshold_notifications_for(user)
    NotificationPreference.find_or_initialize_by(user:, company:).update!(
      monthly_report_digest_enabled: true,
      unsubscribed_from_all: false
    )
  end

  def disable_analytics_threshold_notifications_for(user)
    NotificationPreference.find_or_initialize_by(user:, company:).update!(
      monthly_report_digest_enabled: false,
      unsubscribed_from_all: false
    )
  end
end
