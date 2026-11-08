# frozen_string_literal: true

require "rails_helper"

RSpec.describe Hiring::AssignmentCommunication do
  before do
    DatabaseCleaner.clean
    DatabaseCleaner.strategy = :deletion
    DatabaseCleaner.start
  end

  include_context "assignment message records"
  let(:communication) { described_class.new(assignment:, actor: admin) }

  before do
    ActionMailer::Base.deliveries.clear
    allow(HiringMailer).to receive(:acknowledgement).and_wrap_original do |original, *arguments|
      original.call(*arguments).tap do |mail|
        mail.message.delivery_method(:test)
        mail.message.perform_deliveries = true
      end
    end
  end

  def preview = communication.preview!(kind: "assignment", mailbox_id: mailbox.id)
  def queue_message = communication.queue!(attributes: preview.fetch("intent")).first

  it "does not send or queue on application submission, task issuance or preview" do
    approve_assignment_messages
    assignment
    expect(HiringMessage.count).to eq(0)
    result = preview
    expect(result.fetch("body")).to include("Catalogue assessment", "/hiring-assignment#", assignment.due_at.utc.iso8601)
    expect(result.fetch("body")).not_to include("PRIVATE", "125000", "recommendation", interviewer.email)
    expect(result.fetch("intent").to_json).not_to include(assignment.access_token)
    expect(HiringMessage.count).to eq(0)
  end

  it "requires assignment wording while leaving unrelated setting approval available" do
    approve
    expect(company.hiring_setting).to be_approved
    expect { preview }.to raise_error(Hiring::Intake::InvalidInput)
    approve_assignment_messages
    expect(preview.fetch("subject")).to eq("Your practical assignment")
  end

  it "queues one immutable operation and delivers once after duplicate execution" do
    approve_assignment_messages
    intent = preview.fetch("intent")
    record, created = communication.queue!(attributes: intent)
    duplicate, again = communication.queue!(attributes: intent)
    expect([created, again, duplicate.id]).to eq([true, false, record.id])
    2.times { HiringDeliveryJob.perform_now(record.id) }
    expect(record.reload.state).to eq("sent")
    expect(ActionMailer::Base.deliveries.size).to eq(1)
    expect(ActionMailer::Base.deliveries.sole.to).to eq([application.hiring_candidate.email])
    expect(application.reload.stage).to eq("assignment_assigned")
    expect(assignment.reload.status).to eq("issued")
  end

  %w[expired submitted cancelled revised reassigned withdrawn recipient approval inbox link].each do |change|
    it "blocks queued mail after #{change} changes" do
      approve_assignment_messages
      record = queue_message
      case change
      when "expired" then travel_to(assignment.due_at + 1.second)
      when "submitted" then submit_assignment
      when "cancelled", "revised"
        Hiring::Assignments.new(application:, actor: admin).decide!(assignment:, attributes: {
          "company_id" => company.id, "application_version" => application.reload.lock_version, "assignment_version" => assignment.reload.lock_version,
          "action" => change == "cancelled" ? "cancel" : "revise", "reason" => "New task context", "review_id" => nil,
          "candidate_note" => "Please revise the catalogue", "due_at" => 3.days.from_now.iso8601,
          "template_id" => assignment_template.id, "template_version" => assignment_template.lock_version,
          "reviewer_employment_id" => staff.id, "request_key" => SecureRandom.uuid })
      when "reassigned"
        other = create(:employment, company:, resigned_at: nil)
        other.user.add_role(:employee, company)
        Hiring::Assignments.new(application:, actor: admin).reassign!(assignment:, attributes: {
          "company_id" => company.id, "application_version" => application.reload.lock_version, "assignment_version" => assignment.reload.lock_version,
          "reviewer_employment_id" => other.id, "reason" => "Changed reviewer" })
      when "withdrawn" then application.reload.update!(stage: "withdrawn")
      when "recipient" then application.hiring_candidate.update!(email: "changed@example.test")
      when "approval" then company.hiring_setting.update!(details: company.hiring_setting.details.merge("assignment_body" => "Changed draft"))
      when "inbox" then mailbox.update!(active: false)
      when "link" then allow(Rails.application.config.action_mailer).to receive(:default_url_options).and_return({ host: "different.example.test" })
      end
      HiringDeliveryJob.perform_now(record.id)
      expect(record.reload.state).to eq("failed")
      expect(ActionMailer::Base.deliveries).to be_empty
    end
  end

  it "retains issued task terms when the library is edited later" do
    approve_assignment_messages
    record = queue_message
    Hiring::AssignmentTemplates.new(company:, actor: admin, attributes: { "company_id" => company.id,
      "lock_version" => assignment_template.lock_version, "details" => assignment_template.details.merge("expected_minutes" => 45) }).process(template: assignment_template)
    HiringDeliveryJob.perform_now(record.id)
    expect(record.reload.state).to eq("sent")
  end

  it "rechecks the confirming Admin independently from the template approver" do
    approve_assignment_messages
    actor = create(:user, current_workspace: company)
    create(:employment, company:, user: actor, resigned_at: nil)
    actor.add_role(:admin, company)
    instance = described_class.new(assignment:, actor:)
    record, = instance.queue!(attributes: instance.preview!(kind: "assignment", mailbox_id: mailbox.id).fetch("intent"))
    actor.remove_role(:admin, company)
    HiringDeliveryJob.perform_now(record.id)
    expect(record.reload).to have_attributes(state: "failed", error_code: "permission_changed")
    expect(ActionMailer::Base.deliveries).to be_empty
  end

  it "binds a configured private URL and forces HTTPS without accepting userinfo or query strings" do
    approve_assignment_messages
    allow(Rails.application.config).to receive(:force_ssl).and_return(true)
    expect(described_class.link(assignment)).to start_with("https://")
    helpers = Rails.application.routes.url_helpers
    allow(helpers).to receive(:hiring_assignment_url).and_return("https://user:pass@example.test/hiring-assignment##{assignment.access_token}")
    expect { preview }.to raise_error(Hiring::Intake::InvalidInput)
    allow(helpers).to receive(:hiring_assignment_url).and_return("https://example.test/hiring-assignment?tracking=forbidden##{assignment.access_token}")
    expect { preview }.to raise_error(Hiring::Intake::InvalidInput)
  end

  it "rechecks submission after mail construction before any transport" do
    approve_assignment_messages
    record = queue_message
    allow(HiringMailer).to receive(:acknowledgement).and_wrap_original do |original, *arguments|
      original.call(*arguments).tap do |mail|
        mail.message.delivery_method(:test)
        mail.message.perform_deliveries = true
        submit_assignment
      end
    end
    HiringDeliveryJob.perform_now(record.id)
    expect(record.reload.state).to eq("failed")
    expect(ActionMailer::Base.deliveries).to be_empty
  end

  it "preserves unknown evidence after expiry and cannot retry a no-longer-eligible task" do
    approve_assignment_messages
    record = queue_message
    record.update!(state: "uncertain", error_code: "transport_unknown")
    travel_to(assignment.due_at + 1.second)
    communication.reconcile!(message: record, message_version: record.lock_version, outcome: "not_accepted", evidence: "Local capture proves no DATA", worker_stopped: true)
    expect(record.reload.resolution).to eq("not_accepted")
    expect(HiringMessage.count).to eq(1)
    expect { communication.queue!(attributes: record.content.fetch("intent"), retry_of: record, message_version: record.lock_version) }.to raise_error(Hiring::Intake::Conflict)
  end

  it "requires evidence before a separately confirmed retry and preserves its predecessor" do
    approve_assignment_messages
    record = queue_message
    snapshot = record.content.deep_dup
    record.update!(state: "uncertain", error_code: "transport_unknown")
    expect { communication.queue!(attributes: preview.fetch("intent"), retry_of: record, message_version: record.lock_version) }.to raise_error(Hiring::Intake::Conflict)
    communication.reconcile!(message: record, message_version: record.lock_version, outcome: "not_accepted", evidence: "Local SMTP did not receive DATA", worker_stopped: true)
    retry_record, = communication.queue!(attributes: preview.fetch("intent"), retry_of: record, message_version: record.lock_version)
    expect(retry_record).to have_attributes(original_message_id: record.id, attempt_number: 2)
    expect(record.reload.content).to eq(snapshot)
    expect { communication.queue!(attributes: preview.fetch("intent"), retry_of: record, message_version: record.lock_version) }.to raise_error(Hiring::Intake::Conflict)
  end
end
