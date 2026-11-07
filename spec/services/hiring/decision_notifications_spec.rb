# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Decision notification delivery" do
  before do
    DatabaseCleaner.clean
    DatabaseCleaner.strategy = :deletion
    DatabaseCleaner.start
  end

  include_context "interview message records"

  before do
    ActionMailer::Base.deliveries.clear
    allow(HiringMailer).to receive(:acknowledgement).and_wrap_original do |original, *arguments|
      original.call(*arguments).tap do |mail|
        mail.message.delivery_method(:test)
        mail.message.perform_deliveries = true
      end
    end
  end

  def configure(automatic: false, holds: false)
    approve_decision_messages(automatic:, holds:)
  end

  def decision(outcome: "reject", follow_up: nil, finalize: true)
    service = Hiring::Decisions.new(application:, actor: admin)
    record, = service.create!(attributes: { "company_id" => company.id, "application_version" => application.reload.lock_version,
      "request_key" => SecureRandom.uuid, "outcome" => outcome, "reason" => "PRIVATE DECISION REASON", "owner_employment_id" => outcome == "hold" ? staff.id : nil,
      "follow_up_on" => follow_up })
    if finalize
      service.finalize!(decision: record, attributes: { "company_id" => company.id, "application_version" => application.reload.lock_version, "decision_version" => record.lock_version })
    end
    record.reload
  end

  def sweep
    HiringDecisionNotificationsJob.perform_now
    company.hiring_messages.where(kind: HiringMessage::DECISION_KINDS).order(:id)
  end

  def queue_manual(record)
    communication = Hiring::DecisionCommunication.new(decision: record, actor: admin)
    preview = communication.preview!(kind: "rejection", mailbox_id: mailbox.id)
    communication.queue!(attributes: preview.fetch("intent")).first
  end

  it "defaults automation off and never mails an unfinalized decision" do
    configure
    record = decision(finalize: false)
    expect(sweep).to be_empty
    expect { queue_manual(record) }.to raise_error(Hiring::Intake::InvalidInput)
  end

  it "can edit, finalize and queue the returned decision without a caller reload" do
    configure
    service = Hiring::Decisions.new(application:, actor: admin)
    attributes = { "company_id" => company.id, "application_version" => application.reload.lock_version,
      "request_key" => SecureRandom.uuid, "outcome" => "reject", "reason" => "PRIVATE DRAFT", "owner_employment_id" => nil, "follow_up_on" => nil }
    record, = service.create!(attributes:)
    service.update!(decision: record, attributes: attributes.except("request_key").merge(
      "application_version" => application.reload.lock_version, "decision_version" => record.lock_version, "reason" => "PRIVATE FINAL"))
    service.finalize!(decision: record, attributes: { "company_id" => company.id,
      "application_version" => application.reload.lock_version, "decision_version" => record.lock_version })
    expect(queue_manual(record).state).to eq("queued")
  end

  it "delivers the same explicit rejection once on a closed application, without any private decision fields" do
    configure
    message = queue_manual(decision)
    2.times { HiringDeliveryJob.perform_now(message.id) }
    expect(message.reload.state).to eq("sent")
    mail = ActionMailer::Base.deliveries.sole
    expect(mail.to).to eq(["candidate@example.test"])
    expect(mail.body.decoded).to include("We will not proceed")
    expect(mail.body.decoded).not_to include("PRIVATE", "follow_up", "owner", "assessment")
  end

  it "queues one newly finalized automatic rejection even if its Admin has switched workspaces" do
    configure(automatic: true)
    record = decision
    admin.update!(current_workspace: create(:company))
    2.times { sweep }
    message = sweep.sole
    expect(message.content["automatic"]).to be(true)
    expect(message.content["actor_id"]).to eq(admin.id)
    expect(message.event_key).to eq("decision:#{record.id}")
    HiringDeliveryJob.perform_now(message.id)
    expect(message.reload.state).to eq("sent")
    expect(ActionMailer::Base.deliveries.size).to eq(1)
  end

  it "does not sweep old finalized rejections when automation is enabled" do
    decision
    travel 1.second
    configure(automatic: true)
    expect(sweep).to be_empty
  end

  it "keeps each activation cutoff through edits and restarts only the disabled feature" do
    setting = configure(automatic: true, holds: true)
    rejection_start, hold_start = setting.rejection_automation_started_at, setting.hold_notifications_started_at
    configuration = Hiring::Configure.new(company:, actor: admin)
    setting = configuration.save_draft!(details: setting.details.merge("rejection_body" => "New approved wording"), lock_version: setting.lock_version)
    setting = configuration.approve!(lock_version: setting.lock_version)
    expect([setting.rejection_automation_started_at, setting.hold_notifications_started_at]).to eq([rejection_start, hold_start])
    setting = configuration.save_draft!(details: setting.details.merge("hold_notifications_enabled" => false), lock_version: setting.lock_version)
    expect(setting.hold_notifications_started_at).to be_nil
    travel 1.second
    setting = configuration.save_draft!(details: setting.details.merge("hold_notifications_enabled" => true), lock_version: setting.lock_version)
    setting = configuration.approve!(lock_version: setting.lock_version)
    expect(setting.hold_notifications_started_at).to be > hold_start
    expect(setting.rejection_automation_started_at).to eq(rejection_start)
  end

  it "requires real boolean opt-ins, the enabled kind's template and an active company inbox" do
    setting = approve
    configuration = Hiring::Configure.new(company:, actor: admin)
    expect { configuration.save_draft!(details: setting.details.merge("rejection_automation_enabled" => "true"), lock_version: setting.lock_version) }.to raise_error(Hiring::Intake::InvalidInput)
    expect { configuration.save_draft!(details: setting.details.merge("hold_notifications_enabled" => true), lock_version: setting.lock_version) }.to raise_error(Hiring::Intake::InvalidInput)
    setting = configure(automatic: true)
    foreign = HiringMailbox.create!(company: create(:company), name: "Other", source_email: "foreign@example.test")
    setting = configuration.save_draft!(details: setting.details.merge("decision_mailbox_id" => foreign.id), lock_version: setting.lock_version)
    expect { configuration.approve!(lock_version: setting.lock_version) }.to raise_error(Hiring::Intake::InvalidInput)
    expect(sweep).to be_empty
  end

  {
    "approval_changed" => -> { company.hiring_setting.update!(details: company.hiring_setting.details.merge("rejection_body" => "Unapproved change")) },
    "source_changed" => -> { mailbox.update!(active: false) },
    "recipient_changed" => -> { application.hiring_candidate.update!(email: "changed@example.test") },
    "permission_changed" => -> { admin.remove_role(:admin, company); company.hiring_setting.update_columns(approved_by_id: another_admin.id) },
    "application_closed" => -> { application.update!(stage: "withdrawn") },
    "decision_changed" => -> { application.update!(stage: "interview") }
  }.each do |reason, change|
    it "blocks #{reason} before rejection transport and does not automatically retry" do
      configure
      message = queue_manual(decision)
      instance_exec(&change)
      2.times { HiringDeliveryJob.perform_now(message.id) }
      expect(message.reload.state).to eq("failed")
      expect(message.error_code).to eq(reason)
      expect(ActionMailer::Base.deliveries).to be_empty
    end
  end

  def another_admin
    user = create(:user, current_workspace: company)
    create(:employment, company:, user:, resigned_at: nil)
    user.add_role(:admin, company)
    user
  end

  it "rechecks the finalized rejection after constructing mail" do
    configure
    message = queue_manual(decision)
    allow(HiringMailer).to receive(:acknowledgement).and_wrap_original do |original, *arguments|
      original.call(*arguments).tap do |mail|
        mail.message.delivery_method(:test)
        mail.message.perform_deliveries = true
        application.update!(stage: "withdrawn")
      end
    end
    HiringDeliveryJob.perform_now(message.id)
    expect(message.reload.error_code).to eq("application_closed")
    expect(ActionMailer::Base.deliveries).to be_empty
  end

  it "blocks queued automatic mail when approval is disabled and reapproved" do
    setting = configure(automatic: true)
    decision
    message = sweep.sole
    configuration = Hiring::Configure.new(company:, actor: admin)
    setting = configuration.save_draft!(details: setting.details.merge("rejection_automation_enabled" => false), lock_version: setting.lock_version)
    configuration.approve!(lock_version: setting.lock_version)
    HiringDeliveryJob.perform_now(message.id)
    expect(message.reload.error_code).to eq("approval_changed")
    expect(sweep.count).to eq(1)
    expect(ActionMailer::Base.deliveries).to be_empty
  end

  it "keeps an ambiguous rejection uncertain without a scheduled resend" do
    configure(automatic: true)
    decision
    message = sweep.sole
    allow_any_instance_of(ActionMailer::MessageDelivery).to receive(:deliver_now).and_raise(IOError, "private provider response")
    2.times { HiringDeliveryJob.perform_now(message.id); sweep }
    expect(message.reload.state).to eq("uncertain")
    expect(message.error_code).to eq("transport_unknown")
    expect(sweep.count).to eq(1)
  end

  it "sends one due-hold notice in its saved local zone, including when a newer draft exists" do
    company.update!(timezone: "America/Los_Angeles")
    configure(holds: true)
    held = decision(outcome: "hold", follow_up: "2026-11-04")
    travel_to(Time.utc(2026, 11, 4, 1))
    expect(sweep).to be_empty
    decision(outcome: "pass", finalize: false)
    travel_to(Time.utc(2026, 11, 4, 8))
    2.times { sweep }
    message = sweep.sole
    expect(message.kind).to eq("hold_follow_up")
    expect(message.event_key).to eq("decision:#{held.id}")
    HiringDeliveryJob.perform_now(message.id)
    mail = ActionMailer::Base.deliveries.sole
    expect(mail.to).to eq([admin.email])
    expect(mail.body.decoded).to include("2026-11-04", "America/Los_Angeles")
    expect(mail.body.decoded).not_to include("PRIVATE", "candidate@example.test")
  end

  it "suppresses a pending hold notice after a finalized replacement" do
    configure(holds: true)
    decision(outcome: "hold", follow_up: "2026-11-03")
    message = sweep.sole
    decision(outcome: "pass")
    HiringDeliveryJob.perform_now(message.id)
    expect(message.reload.error_code).to eq("decision_changed")
    expect(ActionMailer::Base.deliveries).to be_empty
  end

  it "records automatic internal notices without waiting for an unrelated lock on the approving user" do
    configure(holds: true)
    decision(outcome: "hold", follow_up: "2026-11-03")
    result = Queue.new
    worker = nil
    admin.with_lock do
      worker = Thread.new do
        ActiveRecord::Base.connection_pool.with_connection { result << sweep.count }
      end
      expect(Timeout.timeout(3) { result.pop }).to eq(1)
    end
    worker.value
    expect(sweep.sole.queued_by_id).to be_nil
    expect(sweep.sole.content["approval_actor_id"]).to eq(admin.id)
  ensure
    worker&.join(5)
  end

  it "does not activate old holds and keeps hold transport uncertainty visible without repeat mail" do
    decision(outcome: "hold", follow_up: "2026-11-03")
    travel 1.second
    configure(holds: true)
    expect(sweep).to be_empty
    decision(outcome: "hold", follow_up: "2026-11-03")
    message = sweep.sole
    allow_any_instance_of(ActionMailer::MessageDelivery).to receive(:deliver_now).and_raise(IOError, "private provider response")
    2.times { HiringDeliveryJob.perform_now(message.id); sweep }
    expect(message.reload.state).to eq("uncertain")
    expect(sweep.count).to eq(1)
  end
end
