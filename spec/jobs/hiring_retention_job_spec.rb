# frozen_string_literal: true

require "rails_helper"

RSpec.describe HiringRetentionJob do
  before do
    DatabaseCleaner.clean
    DatabaseCleaner.strategy = :deletion
    DatabaseCleaner.start
  end
  include_context "issued offer records"

  def policy(enabled: true, days: 30, approve: true)
    configuration = Hiring::Configure.new(company:, actor: admin)
    saved = configuration.save_draft!(details: self.approve.details.merge("retention_enabled" => enabled, "retention_days" => days),
      lock_version: company.reload.hiring_setting.lock_version)
    approve ? configuration.approve!(lock_version: saved.lock_version) : saved
  end

  def old_application
    application.update!(stage: "rejected")
    application.update_columns(created_at: 60.days.ago, updated_at: 60.days.ago)
    application.hiring_candidate.update_columns(created_at: 60.days.ago, updated_at: 60.days.ago)
    application.audits.update_all(created_at: 60.days.ago)
    application
  end

  def old_receipt(record)
    receipt = Hiring::ReceiveEmail.new(mailbox:, source: "From: Candidate <candidate@example.test>\r\nTo: hiring@example.test\r\nMessage-ID: <retention-job@example.test>\r\nSubject: Private source\r\n\r\nPrivate body").process
    receipt.reload.update!(hiring_application: record)
    receipt.update_columns(created_at: 60.days.ago, updated_at: 60.days.ago)
    receipt.audits.update_all(created_at: 60.days.ago)
    receipt.raw_email_attachment.update_columns(created_at: 60.days.ago)
    receipt
  end

  it "runs approved retention through the real queue and purges private source files while retaining anonymous evidence" do
    setting = policy
    record = old_application
    receipt = old_receipt(record)
    blob = receipt.raw_email.blob
    expect(SolidQueue::Job.connection_db_config.configuration_hash).to eq(ApplicationRecord.connection_db_config.configuration_hash)
    perform_enqueued_jobs(only: described_class) { described_class.perform_later }
    perform_enqueued_jobs(only: ActiveStorage::PurgeJob)
    expect(HiringApplication.exists?(record.id)).to be(false)
    expect(ActiveStorage::Blob.exists?(blob.id)).to be(false)
    expect(blob.service.exist?(blob.key)).to be(false)
    expect(company.audits.find_by!(action: "hiring_application_deleted").audited_changes).to eq({})
    expect(setting.reload.approved?).to be(true)
  end

  it "defaults to disabled and requires an approved enabled policy" do
    record = old_application
    approve
    expect(described_class.perform_now).to eq(deleted: 0, skipped: 0)
    expect(record.reload).to be_present
    policy(enabled: false)
    expect(described_class.perform_now).to eq(deleted: 0, skipped: 0)
    expect(record.reload).to be_present
    policy(approve: false)
    described_class.perform_now
    expect(record.reload).to be_present
  end

  it "preserves recent and open applications and uses the configured number of days" do
    policy(days: 90)
    record = old_application
    described_class.perform_now
    expect(record.reload).to be_present
    policy(days: 30)
    record.update_columns(stage: "screening")
    described_class.perform_now
    expect(record.reload).to be_present
    record.update_columns(stage: "rejected", updated_at: 2.days.ago)
    described_class.perform_now
    expect(record.reload).to be_present
  end

  it "rechecks the approved actor and policy version inside deletion locks" do
    setting = policy
    record = old_application
    attributes = { "company_id" => company.id, "application_version" => record.lock_version }
    configuration = Hiring::Configure.new(company:, actor: admin)
    configuration.save_draft!(details: setting.details.merge("retention_days" => 365), lock_version: setting.lock_version)
    service = Hiring::Retention.new(application: record, actor: admin)
    expect { service.delete!(attributes:, approved_setting_version: setting.lock_version) }.to raise_error(Hiring::Intake::Conflict)
    policy
    admin.remove_role(:admin, company)
    described_class.perform_now
    expect(record.reload).to be_present
  end

  it "keeps applications with newer child, receipt, attachment or message activity even when the parent is old" do
    setting = policy
    record = old_application
    message = HiringMessage.create!(company:, hiring_application: record, hiring_setting: setting,
      approved_setting_version: setting.lock_version, kind: "acknowledgement", event_key: "acknowledgement", content: { "to" => "candidate@example.test" }, state: "sent")
    described_class.perform_now
    expect(record.reload).to be_present
    message.destroy!
    record.audits.update_all(created_at: 60.days.ago)
    screening = record.hiring_screenings.create!(company:, created_by: admin, action: "shortlist", from_stage: "rejected", to_stage: "shortlisted",
      application_version: record.lock_version + 1, details: { "reason" => "PRIVATE NEW REVIEW" })
    described_class.perform_now
    expect(record.reload).to be_present
    expect(screening.reload).to be_present
  end

  it "refuses unknown or in-flight delivery and stale scheduled versions" do
    setting = policy
    record = old_application
    message = HiringMessage.create!(company:, hiring_application: record, hiring_setting: setting,
      approved_setting_version: setting.lock_version, kind: "acknowledgement", event_key: "acknowledgement", content: { "to" => "candidate@example.test" }, state: "uncertain")
    message.update_columns(created_at: 60.days.ago, updated_at: 60.days.ago)
    message.audits.update_all(created_at: 60.days.ago)
    expect(described_class.perform_now).to eq(deleted: 0, skipped: 1)
    expect(record.reload).to be_present
    stale_version = record.lock_version
    record.touch
    expect do
      Hiring::Retention.new(application: record, actor: admin).delete!(attributes: {
        "company_id" => company.id, "application_version" => stale_version }, approved_setting_version: setting.lock_version)
    end.to raise_error(Hiring::Intake::Conflict)
  end

  it "preserves recent receipts and file uploads independently of old application timestamps" do
    policy
    record = old_application
    receipt = Hiring::ReceiveEmail.new(mailbox:, source: "From: Candidate <candidate@example.test>\r\nTo: hiring@example.test\r\nMessage-ID: <recent-upload@example.test>\r\nSubject: Private source\r\n\r\nPrivate body").process
    receipt.reload.update!(hiring_application: record)
    described_class.perform_now
    expect(record.reload).to be_present
    receipt.update_columns(created_at: 60.days.ago, updated_at: 60.days.ago)
    receipt.audits.update_all(created_at: 60.days.ago)
    described_class.perform_now
    expect(record.reload).to be_present
    receipt.raw_email_attachment.update_columns(created_at: 60.days.ago)
    expect(described_class.perform_now).to eq(deleted: 1, skipped: 0)
    expect(HiringApplication.exists?(record.id)).to be(false)
  end

  it "can apply an approved workspace policy after its active approver switches browser workspaces" do
    policy
    record = old_application
    admin.update!(current_workspace: create(:company))
    described_class.perform_now
    expect(HiringApplication.exists?(record.id)).to be(false)
  end

  it "fails visibly and preserves private data when the purge queue is unavailable" do
    policy
    record = old_application
    receipt = old_receipt(record)
    allow(ActiveStorage::PurgeJob).to receive(:perform_later).and_return(false)
    expect { described_class.perform_now }.to raise_error(Hiring::Retention::CleanupUnavailable)
    expect(record.reload).to be_present
    expect(receipt.reload.raw_email.download).to include("Private body")
  end
end
