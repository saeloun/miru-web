# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Candidate forms in hiring acknowledgements" do
  let(:company) { create(:company) }
  let(:admin) { create(:user, current_workspace: company) }
  let(:membership) { create(:employment, company:, user: admin, resigned_at: nil) }
  let(:mailbox) { HiringMailbox.create!(company:, name: "Hiring", source_email: "hiring@example.test") }
  let(:details) { HiringSetting::TEXT_FIELDS.index_with { |field| "Approved #{field.humanize}" }.merge("client_count" => 4) }
  let(:configuration) { Hiring::Configure.new(company:, actor: admin) }
  let(:receipt) do
    source = Mail.new do
      from "Synthetic Applicant <candidate@example.test>"
      to "hiring@example.test"
      subject "Application for a developer role"
      message_id "private-form-ack@example.test"
      body "Please consider my application."
      attachments["resume.txt"] = "Synthetic resume"
    end.encoded
    record = Hiring::ReceiveEmail.new(mailbox:, source:).process
    Hiring::EmailIntake.new(record).process
    record.reload
  end

  before do
    DatabaseCleaner.clean
    DatabaseCleaner.strategy = :deletion
    DatabaseCleaner.start
    admin.add_role(:admin, company)
    membership
    receipt
    expect(receipt.state).to eq("accepted")
  end

  def approve(enabled: true)
    form = Hiring::Form.default_schema.merge("enabled" => enabled)
    setting = configuration.save_draft!(details:, form:, lock_version: nil)
    configuration.approve!(lock_version: setting.lock_version)
  end

  def queue
    Hiring::Acknowledgement.new(receipt:, actor: admin).queue
  end

  it "creates one approved fragment link and preserves it when acknowledgement queuing is retried" do
    approve
    message = queue
    expect(message).to be_present
    expect(message.content["portal_access_id"]).to be_present
    access = HiringPortalAccess.find(message.content.fetch("portal_access_id"))
    link = URI(message.content.fetch("body").scan(%r{https?://\S+}).last)
    expect(link.path).to eq("/hiring-form")
    expect(link.query).to be_nil
    expect(link.fragment).to eq(access.access_token)
    snapshot = message.content
    expect(queue.id).to eq(message.id)
    expect(HiringPortalAccess.count).to eq(1)
    expect(access.reload.revoked_at).to be_nil
    expect(message.reload.content).to eq(snapshot)
    expect(access.hiring_application_id).to eq(receipt.hiring_application_id)
    expect(access.form_schema.fetch("enabled")).to be(true)
    expect(HiringMessage.count).to eq(1)
    expect(enqueued_jobs.last.fetch(:args).to_json).not_to include(access.access_token, "candidate@example.test")
  end

  it "keeps approved email-only acknowledgements free of form links" do
    approve(enabled: false)
    message = queue
    expect(message).to be_present
    expect(message.content).not_to have_key("portal_access_id")
    expect(message.content.fetch("body")).not_to include("/hiring-form")
    expect(HiringPortalAccess.count).to eq(0)
  end

  it "blocks a revoked link before sending and requires an explicit new attempt with a new approved link" do
    setting = approve
    first = queue
    expect(first).to be_present
    expect(first.content["portal_access_id"]).to be_present
    access = HiringPortalAccess.find(first.content.fetch("portal_access_id"))
    original = first.content
    access.update!(revoked_at: Time.current)
    HiringDeliveryJob.perform_now(first.id)
    expect(first.reload).to have_attributes(state: "failed", error_code: "portal_unavailable")
    expect(ActionMailer::Base.deliveries).to be_empty
    expect(queue.id).to eq(first.id)
    expect(HiringPortalAccess.count).to eq(1)
    service = Hiring::Acknowledgement.new(receipt:, actor: admin)
    retry_message = service.retry!(message: first, message_lock_version: first.lock_version,
      lock_version: receipt.reload.lock_version, approved_setting_version: setting.lock_version, recipient: "candidate@example.test")
    expect(retry_message.id).not_to eq(first.id)
    expect(retry_message.content.fetch("portal_access_id")).not_to eq(access.id)
    expect(first.reload.content).to eq(original)
    expect(access.reload.revoked_at).to be_present
    HiringDeliveryJob.perform_now(retry_message.id)
    expect(retry_message.reload.state).to eq("sent")
    expect(ActionMailer::Base.deliveries.size).to eq(1)
  end

  it "rechecks the link after mail preparation and before transport delivery" do
    approve
    message = queue
    expect(message).to be_present
    expect(message.content["portal_access_id"]).to be_present
    access = HiringPortalAccess.find(message.content.fetch("portal_access_id"))
    allow(HiringMailer).to receive(:acknowledgement).and_wrap_original do |original, *arguments|
      original.call(*arguments).tap { access.update!(revoked_at: Time.current) }
    end
    HiringDeliveryJob.perform_now(message.id)
    expect(message.reload).to have_attributes(state: "failed", error_code: "portal_unavailable")
    expect(ActionMailer::Base.deliveries).to be_empty
  end

  it "adds an HTTPS form link to automatic intake when the application requires SSL" do
    approve
    allow(Rails.application.config).to receive(:force_ssl).and_return(true)
    source = Mail.new do
      from "Another Applicant <another-candidate@example.test>"
      to "hiring@example.test"
      subject "Application for Rails developer"
      message_id "another-private-form-ack@example.test"
      body "Please review my application."
      attachments["resume.txt"] = "Another synthetic resume"
    end.encoded
    record = Hiring::ReceiveEmail.new(mailbox:, source:).process
    Hiring::EmailIntake.new(record).process
    expect(record.reload.state).to eq("accepted")
    message = company.hiring_messages.find_by(hiring_application_id: record.hiring_application_id)
    expect(message).to be_present
    expect(message.content["portal_access_id"]).to be_present
    link = URI(message.content.fetch("body").scan(%r{https?://\S+}).last)
    expect(link.scheme).to eq("https")
    expect(link.fragment).to eq(HiringPortalAccess.find(message.content.fetch("portal_access_id")).access_token)
    expect(message.queued_by_id).to be_nil
    expect(HiringPortalAccess.count).to eq(1)
  end
end
