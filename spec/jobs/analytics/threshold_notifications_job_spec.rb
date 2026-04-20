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
    Rails.cache.clear
    clear_enqueued_jobs
  end

  it "sends threshold alert emails to financial recipients" do
    allow(Analytics::ThresholdEvaluator).to receive(:process).and_return([
      { type: "low_utilization", title: "Low utilization detected", message: "Alert", metadata: {} }
    ])

    expect {
      described_class.perform_now([company.id])
    }.to have_enqueued_mail(AnalyticsMailer, :threshold_alert)
  end

  it "does not notify employees" do
    allow(Analytics::ThresholdEvaluator).to receive(:process).and_return([
      { type: "low_utilization", title: "Low utilization detected", message: "Alert", metadata: {} }
    ])

    described_class.perform_now([company.id])

    mail = enqueued_jobs.last
    args = mail[:args].last["params"] || mail[:args].last[:params]
    expect(args["recipients"] || args[:recipients]).to match_array([owner.email, admin.email])
  end

  it "does not resend the same alert within the anti-spam window" do
    allow(Analytics::ThresholdEvaluator).to receive(:process).and_return([
      { type: "low_utilization", title: "Low utilization detected", message: "Alert", metadata: {} }
    ])

    expect {
      described_class.perform_now([company.id])
      described_class.perform_now([company.id])
    }.to have_enqueued_mail(AnalyticsMailer, :threshold_alert).once
  end

  it "does not notify when there are no alerts" do
    allow(Analytics::ThresholdEvaluator).to receive(:process).and_return([])

    expect {
      described_class.perform_now([company.id])
    }.not_to have_enqueued_mail(AnalyticsMailer, :threshold_alert)
  end
end
