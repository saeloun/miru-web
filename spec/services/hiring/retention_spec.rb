# frozen_string_literal: true

require "rails_helper"

RSpec.describe Hiring::Retention do
  include SignatureRequestFixtures

  before do
    DatabaseCleaner.clean
    DatabaseCleaner.strategy = :deletion
    DatabaseCleaner.start
  end
  include_context "issued offer records"

  def erase(record = application, actor: admin, input: nil)
    described_class.new(application: record, actor:).delete!(attributes: input || {
      "company_id" => record.company_id, "application_version" => record.reload.lock_version })
  end

  def receipt_for(destination = mailbox)
    source = Mail.new do
      from "Taylor Candidate <candidate@example.test>"
      to "hiring@example.test"
      message_id "private-retention@example.test"
      date Time.utc(2026, 11, 8)
      subject "Application for engineer"
      body "PRIVATE CANDIDATE BODY"
    end.encoded
    Hiring::ReceiveEmail.new(mailbox: destination, source:).process.tap do |receipt|
      receipt.reload.update!(hiring_application: application) if destination.company_id == company.id
    end
  end

  def holding(record)
    ready, release = Queue.new, Queue.new
    worker = Thread.new do
      ActiveRecord::Base.connection_pool.with_connection do
        record.class.transaction do
          record.class.find(record.id).lock!
          ready << true
          release.pop
        end
      end
    end
    ready.pop
    yield
  ensure
    release << true if release
    worker&.value
  end

  it "deletes private graph, capabilities, source bytes and identifying audits, leaving only anonymous deletion evidence" do
    offer = started_onboarding_record
    invitation = offer.onboarding_invitation
    candidate = application.hiring_candidate
    receipt = receipt_for
    blob = receipt.raw_email.blob
    booking
    expect(erase).to eq(deleted: true)
    perform_enqueued_jobs(only: ActiveStorage::PurgeJob)
    expect(HiringApplication.exists?(application.id)).to be(false)
    expect(HiringCandidate.exists?(candidate.id)).to be(false)
    expect(HiringOffer.exists?(offer.id)).to be(false)
    expect(Invitation.exists?(invitation.id)).to be(false)
    expect(HiringInterview.exists?(round.id)).to be(false)
    expect(HiringReceipt.exists?(receipt.id)).to be(false)
    expect(ActionMailbox::InboundEmail.exists?(receipt.inbound_email_id)).to be(false)
    expect(ActiveStorage::Blob.exists?(blob.id)).to be(false)
    expect(blob.service.exist?(blob.key)).to be(false)
    event = company.audits.find_by!(action: "hiring_application_deleted")
    expect(event.audited_changes).to eq({})
    expect(event.auditable).to eq(company)
    expect(Audited.audit_class.where(auditable_type: "HiringApplication", auditable_id: application.id)).not_to exist
    expect(Invitation.find_by(token: invitation.token)).to be_nil
  end

  it "preserves another tenant's shared inbound source and storage" do
    receipt = receipt_for
    other_mailbox = HiringMailbox.create!(company: create(:company), name: "Other", source_email: "other@example.test")
    other = receipt_for(other_mailbox)
    blob = receipt.raw_email.blob
    expect(other.raw_email.blob_id).to eq(blob.id)
    erase
    perform_enqueued_jobs(only: ActiveStorage::PurgeJob)
    expect(other.reload.source).to include("PRIVATE CANDIDATE BODY")
    expect(ActionMailbox::InboundEmail.exists?(other.inbound_email_id)).to be(true)
    expect(blob.reload.service.exist?(blob.key)).to be(true)
  end

  it "keeps the shared candidate while another application still exists" do
    candidate = application.hiring_candidate
    second = company.hiring_applications.create!(hiring_candidate: candidate, request_key: SecureRandom.uuid,
      source: "manual", received_at: Time.current, creation_details: { "full_name" => candidate.full_name })
    erase
    expect(second.reload.hiring_candidate).to eq(candidate)
  end

  def resume_submission
    setting = approve
    access = application.hiring_portal_accesses.create!(company:, hiring_setting: setting, issued_by: admin,
      approved_setting_version: setting.lock_version, form_schema: Hiring::Form.default_schema,
      introduction: "PRIVATE INTRODUCTION", expires_at: 2.days.from_now)
    submission = access.create_hiring_submission!(company:, hiring_application: application, answers: {})
    submission.resume.attach(io: StringIO.new("PRIVATE RESUME"), filename: "resume.pdf", content_type: "application/pdf", identify: false)
    submission.reload
  end

  it "removes form tokens, resume and assignment files along with pending message snapshots" do
    submission = resume_submission
    access = submission.hiring_portal_access
    template = HiringAssignmentTemplate.create!(company:, title: "Reusable template", details: {})
    revision = template.revisions.create!(company:, template_version: 0, snapshot: { "title" => template.title })
    assignment = application.hiring_assignments.create!(company:, template_revision: revision, due_at: 2.days.from_now,
      terms: { "details" => { "submission_method" => "files" } }, request_details: { "reviewed" => true }, request_key: SecureRandom.uuid)
    work = assignment.create_submission!(company:, answers: {})
    blob = ActiveStorage::Blob.create_and_upload!(io: StringIO.new("PRIVATE WORK"), filename: "work.bin", content_type: "application/octet-stream", identify: false,
      metadata: { identified: true, analyzed: true, hiring_assignment_submission_id: work.id, hiring_company_id: company.id, hiring_sha256: "a" * 64 })
    work.files.attach(blob)
    message = HiringMessage.create!(company:, hiring_application: application, hiring_setting: access.hiring_setting,
      approved_setting_version: access.approved_setting_version, kind: "acknowledgement", event_key: "acknowledgement", content: { "to" => "candidate@example.test" }, state: "queued")
    attempt = HiringMessage.create!(company:, hiring_application: application, hiring_setting: access.hiring_setting,
      approved_setting_version: access.approved_setting_version, kind: "acknowledgement", event_key: "acknowledgement", content: message.content,
      original_message: message, attempt_number: 2, state: "failed")
    blobs = [submission.resume.blob, blob]
    erase
    perform_enqueued_jobs(only: ActiveStorage::PurgeJob)
    [submission, access, assignment, work, message, attempt].each { |record| expect(record.class.exists?(record.id)).to be(false) }
    blobs.each do |file|
      expect(ActiveStorage::Blob.exists?(file.id)).to be(false)
      expect(file.service.exist?(file.key)).to be(false)
    end
    expect(template.reload).to be_present
    expect(revision.reload).to be_present
  end

  it "preserves a candidate blob still attached to an employee document" do
    submission = resume_submission
    blob = submission.resume.blob
    document = EmployeeDocument.create!(employment: membership, uploaded_by: admin, kind: "contract", file: blob)
    erase
    perform_enqueued_jobs(only: ActiveStorage::PurgeJob)
    expect(document.reload.file.download).to eq("PRIVATE RESUME")
    expect(blob.reload.service.exist?(blob.key)).to be(true)
  end

  it "preserves onboarded employees, private profiles and original legal PDFs" do
    offer = started_onboarding_record
    acceptance = CreateInvitedUserService.new(offer.onboarding_invitation.token)
    acceptance.process
    expect(acceptance.success).to be(true), acceptance.error_message
    employment = offer.reload.employment
    signature = approved_signature_request(company:, actor: admin, employment:)
    revision = signature.current_revision
    original = revision.original_bytes(revision.documents.first.fetch("key"))
    erase
    expect(employment.reload.employee_record).to be_present
    expect(signature.reload.current_revision.original_bytes(revision.documents.first.fetch("key"))).to eq(original)
  end

  it "rejects foreign tenants, inactive permission, malformed input and stale review" do
    record = application
    expect { erase(input: { "company_id" => create(:company).id, "application_version" => record.lock_version }) }.to raise_error(Hiring::Intake::Conflict)
    expect { erase(input: { "company_id" => company.id, "application_version" => record.lock_version, "force" => true }) }.to raise_error(Hiring::Intake::InvalidInput)
    expect { erase(input: { "company_id" => company.id, "application_version" => record.lock_version - 1 }) }.to raise_error(Hiring::Intake::Conflict)
    foreign_admin = create(:user)
    expect { erase(actor: foreign_admin) }.to raise_error(Pundit::NotAuthorizedError)
    membership.discard!
    expect { erase }.to raise_error(Pundit::NotAuthorizedError)
    expect(record.reload).to be_present
  end

  it "refuses sending and unknown delivery without erasing evidence" do
    setting = approve
    %w[sending uncertain].each do |state|
      message = HiringMessage.create!(company:, hiring_application: application, hiring_setting: setting,
        approved_setting_version: setting.lock_version, kind: "acknowledgement", event_key: "acknowledgement", content: { "to" => "candidate@example.test" }, state:)
      expect { erase }.to raise_error(Hiring::Intake::Conflict, /delivery/i)
      expect(message.reload.state).to eq(state)
      message.destroy!
    end
  end

  it "conflicts promptly with an independently held receipt lock instead of deadlocking receipt intake" do
    receipt = receipt_for
    holding(receipt) { expect { Timeout.timeout(3) { erase } }.to raise_error(Hiring::Intake::Conflict, /updated/i) }
    expect(receipt.reload).to be_present
    expect(application.reload).to be_present
  end

  it "conflicts with a live delivery worker's row lock before deleting its snapshot" do
    setting = approve
    message = HiringMessage.create!(company:, hiring_application: application, hiring_setting: setting,
      approved_setting_version: setting.lock_version, kind: "acknowledgement", event_key: "acknowledgement", content: { "to" => "candidate@example.test" }, state: "queued")
    holding(message) { expect { Timeout.timeout(3) { erase } }.to raise_error(Hiring::Intake::Conflict, /updated/i) }
    expect(message.reload).to be_present
  end

  it "refuses deletion when private file cleanup cannot be queued" do
    receipt = receipt_for
    blob = receipt.raw_email.blob
    allow(ActiveStorage::PurgeJob).to receive(:perform_later).and_return(false)
    expect { erase }.to raise_error(Hiring::Intake::Conflict, /cleanup.*queued/)
    expect(application.reload).to be_present
    expect(receipt.reload.raw_email.blob_id).to eq(blob.id)
    expect(blob.reload.service.exist?(blob.key)).to be(true)
  end

  it "rolls back database deletion and durable purge jobs together on failure" do
    receipt = receipt_for
    blob = receipt.raw_email.blob
    service = described_class.new(application:, actor: admin)
    allow(service).to receive(:remove_audits!).and_raise("synthetic rollback")
    allow(ActiveStorage::PurgeJob).to receive(:queue_adapter).and_return(ActiveJob::QueueAdapters::SolidQueueAdapter.new)
    expect do
      expect do
        service.delete!(attributes: { "company_id" => company.id, "application_version" => application.reload.lock_version })
      end.to raise_error("synthetic rollback")
    end.not_to change(SolidQueue::Job, :count)
    expect(application.reload).to be_present
    expect(receipt.reload.raw_email.blob_id).to eq(blob.id)
    expect(blob.reload.service.exist?(blob.key)).to be(true)
  end

  it "conflicts with concurrent source receipt creation holding the shared checksum lock" do
    receipt = receipt_for
    ready, release = Queue.new, Queue.new
    worker = Thread.new do
      ActiveRecord::Base.connection_pool.with_connection do |connection|
        ActiveRecord::Base.transaction do
          connection.execute("SELECT pg_advisory_xact_lock(#{receipt.source_checksum.first(15).to_i(16)})")
          ready << true
          release.pop
        end
      end
    end
    ready.pop
    expect { Timeout.timeout(3) { erase } }.to raise_error(Hiring::Intake::Conflict, /updated/i)
    expect(receipt.reload).to be_present
  ensure
    release << true if release
    worker&.value
  end
end
