# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Hiring email review" do
  let(:company) { create(:company) }
  let(:admin) { create(:user, current_workspace: company) }
  let!(:membership) { create(:employment, company:, user: admin, resigned_at: nil) }
  let(:mailbox) { HiringMailbox.create!(company:, name: "Forwarded applications", source_email: "hello@example.test") }
  let(:receipt) do
    email = Mail.new do
      from "Internal Forwarder <internal@example.test>"
      to "hello@example.test"
      subject "Fwd: Application for Rails developer"
      message_id "review-42@example.test"
      text_part { body "Forwarded application from Jaya; please review before adding." }
      attachments["resume.txt"] = "Private resume"
    end
    record = Hiring::ReceiveEmail.new(mailbox:, source: email.encoded).process
    Hiring::EmailIntake.new(record).process
    record.reload
  end
  let(:review) { Hiring::ReviewReceipt.new(company:, actor: admin, receipt:) }
  let(:identity) { { full_name: " Jaya Rao ", email: " JAYA@example.test " } }

  before { admin.add_role(:admin, company) }

  def approve_settings
    config = Hiring::Configure.new(company:, actor: admin)
    details = HiringSetting::TEXT_FIELDS.index_with { |field| "Approved #{field}" }.merge("client_count" => 3)
    draft = config.save_draft!(details:, lock_version: nil)
    config.approve!(lock_version: draft.lock_version)
  end

  it "requires verified identity and preserves the original source when adding an application" do
    record = receipt
    expect(record.state).to eq("review")
    raw = record.raw_email.download
    original = record.details
    version = record.lock_version
    review.accept!(**identity, lock_version: version)
    record.reload
    expect(record).to have_attributes(state: "accepted", reviewed_by_id: admin.id)
    expect(record.reviewed_at).to be_present
    expect(record.raw_email.download).to eq(raw)
    expect(record.details).to include(original)
    expect(record.details.fetch("reviewed_identity")).to eq("full_name" => "Jaya Rao", "email" => "jaya@example.test")
    application = record.hiring_application
    expect(application).to have_attributes(source: "email", submitted_name: "Jaya Rao", created_by_id: admin.id)
    expect(application.hiring_candidate.email).to eq("jaya@example.test")
    expect(application.received_at).to eq(record.received_at)
    audit = record.audits.reorder(id: :desc).first
    expect(audit.user_id).to eq(admin.id)
    expect(audit.audited_changes).not_to have_key("details")
    expect(HiringMessage.count).to eq(0)
    expect { review.accept!(**identity, lock_version: version) }.to raise_error(Hiring::Intake::Conflict)
    expect(company.hiring_applications.count).to eq(1)
  end

  it "only queues an approved acknowledgement when the reviewer explicitly asks" do
    approve_settings
    review.accept!(**identity, acknowledge: true, lock_version: receipt.lock_version)
    message = company.hiring_messages.sole
    expect(message.content.fetch("to")).to eq("jaya@example.test")
    expect(message.queued_by_id).to eq(admin.id)
    expect(ActionMailer::Base.deliveries).to be_empty
  end

  it "does not send before template approval, including explicit requests" do
    review.accept!(**identity, acknowledge: true, lock_version: receipt.lock_version)
    expect(HiringMessage.count).to eq(0)
  end

  it "links a reviewed reply to an explicitly selected application without overwriting its candidate" do
    application = Hiring::Intake.new(company:, actor: admin, attributes: {
      "company_id" => company.id, "request_key" => SecureRandom.uuid, "full_name" => "Jaya Original", "email" => "jaya@example.test" }).process
    review.accept!(**identity, application_id: application.id, lock_version: receipt.lock_version)
    expect(receipt.reload.hiring_application_id).to eq(application.id)
    expect(application.hiring_candidate.reload.full_name).to eq("Jaya Original")
    expect(company.hiring_applications.count).to eq(1)
  end

  it "requires the selected application to match both the workspace and verified email" do
    wrong_person = Hiring::Intake.new(company:, actor: admin, attributes: {
      "company_id" => company.id, "request_key" => SecureRandom.uuid, "full_name" => "Other Applicant", "email" => "other@example.test" }).process
    expect do
      review.accept!(**identity, application_id: wrong_person.id, lock_version: receipt.lock_version)
    end.to raise_error(Hiring::Intake::InvalidInput)
    other_company = create(:company)
    other_admin = create(:user, current_workspace: other_company)
    create(:employment, company: other_company, user: other_admin, resigned_at: nil)
    other_admin.add_role(:admin, other_company)
    foreign = Hiring::Intake.new(company: other_company, actor: other_admin, attributes: {
      "company_id" => other_company.id, "request_key" => SecureRandom.uuid, "full_name" => "Jaya", "email" => "jaya@example.test" }).process
    expect do
      review.accept!(**identity, application_id: foreign.id, lock_version: receipt.lock_version)
    end.to raise_error(ActiveRecord::RecordNotFound)
    expect(receipt.reload.state).to eq("review")
  end

  it "keeps dismissed mail as private history without creating an application or message" do
    review.dismiss!(lock_version: receipt.lock_version)
    expect(receipt.reload).to have_attributes(state: "dismissed", reviewed_by_id: admin.id)
    expect(receipt.raw_email).to be_attached
    expect(company.hiring_applications.count).to eq(0)
    expect(HiringMessage.count).to eq(0)
  end

  it "reuses a reviewed application's identity for the same original source at another inbox" do
    approve_settings
    first = receipt
    other = HiringMailbox.create!(company:, name: "Second inbox", source_email: "second@example.test")
    copy = Hiring::ReceiveEmail.new(mailbox: other, source: first.raw_email.download).process
    Hiring::EmailIntake.new(copy).process
    review.accept!(**identity, acknowledge: true, lock_version: first.lock_version)
    Hiring::ReviewReceipt.new(company:, actor: admin, receipt: copy).accept!(**identity, acknowledge: true, lock_version: copy.reload.lock_version)
    expect(copy.reload.hiring_application_id).to eq(first.reload.hiring_application_id)
    expect(company.hiring_applications.count).to eq(1)
    expect(company.hiring_messages.count).to eq(1)
  end

  it "uses the first observed source receipt even when an admin reviews a later inbox copy first" do
    first = receipt
    first.update!(received_at: 2.days.ago)
    other = HiringMailbox.create!(company:, name: "Second inbox", source_email: "second@example.test")
    copy = Hiring::ReceiveEmail.new(mailbox: other, source: first.raw_email.download).process
    Hiring::EmailIntake.new(copy).process
    Hiring::ReviewReceipt.new(company:, actor: admin, receipt: copy).accept!(**identity, lock_version: copy.reload.lock_version)

    expect(copy.reload.hiring_application.received_at).to eq(first.reload.received_at)
  end

  it "rejects invalid types, addresses and stale versions without writing records" do
    [{ full_name: [] }, { full_name: "Bad\nName" }, { email: "two@example.test,other@example.test" },
      { email: {} }, { acknowledge: "true" }, { application_id: [1] }, { lock_version: "0" }].each do |invalid|
      expect do
        review.accept!(**identity, lock_version: receipt.lock_version, **invalid)
      end.to raise_error(Hiring::Intake::InvalidInput)
    end
    expect { review.dismiss!(lock_version: receipt.lock_version + 1) }.to raise_error(Hiring::Intake::Conflict)
    expect(company.hiring_candidates.count).to eq(0)
    expect(receipt.reload.state).to eq("review")
  end

  it "rechecks the persisted workspace and active role and rejects foreign receipts" do
    record = receipt
    foreign = create(:company)
    User.where(id: admin.id).update_all(current_workspace_id: foreign.id)
    expect { review.dismiss!(lock_version: record.lock_version) }.to raise_error(Pundit::NotAuthorizedError)
    admin.update!(current_workspace: company)
    membership.discard
    expect { review.accept!(**identity, lock_version: record.lock_version) }.to raise_error(Pundit::NotAuthorizedError)
    membership.undiscard
    mismatched = Hiring::ReviewReceipt.new(company: foreign, actor: admin, receipt: record)
    expect { mismatched.dismiss!(lock_version: record.lock_version) }.to raise_error(Pundit::NotAuthorizedError)
    expect(record.reload.state).to eq("review")
  end
end
