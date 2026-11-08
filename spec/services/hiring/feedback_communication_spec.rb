# frozen_string_literal: true

require "rails_helper"

RSpec.describe Hiring::FeedbackCommunication do
  before do
    DatabaseCleaner.clean
    DatabaseCleaner.strategy = :deletion
    DatabaseCleaner.start
  end

  include_context "interview message records"

  before do
    enable_feedback_notifications
    travel_to(booking.ends_at + 1.minute)
    HiringFeedbackRequestsJob.perform_now
  end

  let(:feedback) { booking.hiring_feedbacks.sole }
  let(:communication) { described_class.new(feedback:, actor: admin) }
  let(:message) { company.hiring_messages.find_by!(kind: "feedback_prompt") }

  def preview = communication.preview!(kind: message.kind, mailbox_id: mailbox.id)

  def retry_message(intent = preview.fetch("intent"), record = message)
    communication.queue!(attributes: intent, retry_of: record, message_version: record.reload.lock_version).first
  end

  it "requires a recorded retryable notice and never creates a free-standing operation" do
    expect { preview }.to raise_error(Hiring::Intake::Conflict)
    expect { communication.queue!(attributes: {}) }.to raise_error(Hiring::Intake::InvalidInput)
    expect(company.hiring_messages.count).to eq(1)
  end

  it "previews frozen internal content and creates a separate latest attempt only after confirmation" do
    message.update!(state: "failed", error_code: "transport_rejected")
    frozen_content = message.content.deep_dup
    result = preview
    expect(result.slice("to", "reply_to", "subject", "body")).to eq(frozen_content.slice("to", "reply_to", "subject", "body"))
    expect(result.fetch("body")).not_to include("PRIVATE")
    expect(company.hiring_messages.count).to eq(1)
    retry_record = retry_message(result.fetch("intent"))
    expect(retry_record).to have_attributes(original_message_id: message.id, attempt_number: 2, queued_by_id: admin.id, state: "queued")
    expect(retry_record.content).to include("automatic" => false, "actor_id" => admin.id)
    expect(message.reload.content).to eq(frozen_content)
    expect { retry_message(result.fetch("intent")) }.to raise_error(Hiring::Intake::Conflict)
    HiringFeedbackRequestsJob.perform_now
    expect(company.hiring_messages.count).to eq(2)
  end

  it "requires evidence and a stopped worker before an unknown delivery can be retried" do
    message.update!(state: "uncertain", error_code: "transport_unknown")
    expect { preview }.to raise_error(Hiring::Intake::Conflict)
    expect do
      communication.reconcile!(message:, message_version: message.lock_version, outcome: "not_accepted", evidence: "Local SMTP capture shows no DATA", worker_stopped: false)
    end.to raise_error(Hiring::Intake::InvalidInput)
    expect do
      communication.reconcile!(message:, message_version: message.lock_version, outcome: "not_accepted", evidence: "", worker_stopped: true)
    end.to raise_error(Hiring::Intake::InvalidInput)
    communication.reconcile!(message:, message_version: message.lock_version, outcome: "not_accepted", evidence: "Local SMTP capture shows no DATA", worker_stopped: true)
    expect(company.hiring_messages.count).to eq(1)
    expect(retry_message.attempt_number).to eq(2)
  end

  it "keeps accepted-outcome evidence available after the application closes without sending anything" do
    message.update!(state: "uncertain", error_code: "transport_unknown")
    application.reload.update!(stage: "withdrawn")
    communication.reconcile!(message:, message_version: message.lock_version, outcome: "accepted", evidence: "Local SMTP accepted DATA", worker_stopped: false)
    expect(message.reload.resolution).to eq("accepted")
    expect { preview }.to raise_error(Hiring::Intake::Conflict)
    expect(company.hiring_messages.count).to eq(1)
  end

  %w[recipient approval inbox feedback application].each do |change|
    it "rejects a stale preview after #{change} changes" do
      message.update!(state: "failed", error_code: "transport_rejected")
      intent = preview.fetch("intent")
      case change
      when "recipient"
        interviewer.skip_reconfirmation!
        interviewer.update!(email: "changed@example.test")
      when "approval"
        company.hiring_setting.update!(details: company.hiring_setting.details.merge("feedback_prompt_body" => "Changed wording"))
      when "inbox"
        mailbox.update!(active: false)
      when "feedback"
        travel_to(booking.feedback_due_at + 1.second)
      when "application"
        application.reload.update!(stage: "withdrawn")
      end
      expect { retry_message(intent) }.to raise_error(Hiring::Intake::Conflict)
      expect(company.hiring_messages.count).to eq(1)
    end
  end

  it "rejects stale message versions and revoked Admin access for recovery" do
    message.update!(state: "uncertain", error_code: "transport_unknown")
    expect do
      communication.reconcile!(message:, message_version: message.lock_version - 1, outcome: "accepted", evidence: "Capture", worker_stopped: false)
    end.to raise_error(Hiring::Intake::Conflict)
    admin.remove_role(:admin, company)
    expect do
      communication.reconcile!(message:, message_version: message.lock_version, outcome: "accepted", evidence: "Capture", worker_stopped: false)
    end.to raise_error(Pundit::NotAuthorizedError)
    expect(message.reload.resolution).to be_nil
  end

  it "rejects a preview bound to a different predecessor even when both kinds are retryable" do
    message.update!(state: "failed", error_code: "transport_rejected")
    intent = preview.fetch("intent")
    expect do
      communication.queue!(attributes: intent.merge("source_message_id" => message.id + 1), retry_of: message, message_version: message.lock_version)
    end.to raise_error(Hiring::Intake::Conflict)
    expect(company.hiring_messages.count).to eq(1)
  end

  it "serializes competing confirmations into one retry attempt" do
    message.update!(state: "failed", error_code: "transport_rejected")
    intent = preview.fetch("intent")
    identity = [feedback.id, admin.id, message.id, message.lock_version]
    ready, start = Queue.new, Queue.new
    outcomes = 2.times.map do
      Thread.new do
        ActiveRecord::Base.connection_pool.with_connection do
          ready << true
          start.pop
          record_id, actor_id, message_id, version = identity
          instance = described_class.new(feedback: HiringFeedback.find(record_id), actor: User.find(actor_id))
          instance.queue!(attributes: intent, retry_of: HiringMessage.find(message_id), message_version: version)
          :created
        rescue Hiring::Intake::Conflict
          :conflict
        end
      end
    end
    2.times { ready.pop }
    2.times { start << true }
    expect(outcomes.map(&:value).sort).to eq(%i[conflict created])
    expect(message.attempts.count).to eq(2)
  end

  it "delivers a confirmed retry once" do
    ActionMailer::Base.deliveries.clear
    allow(HiringMailer).to receive(:acknowledgement).and_wrap_original do |original, *arguments|
      original.call(*arguments).tap do |mail|
        mail.message.delivery_method(:test)
        mail.message.perform_deliveries = true
      end
    end
    message.update!(state: "failed", error_code: "transport_rejected")
    record = retry_message
    2.times { HiringDeliveryJob.perform_now(record.id) }
    expect(record.reload.state).to eq("sent")
    expect(ActionMailer::Base.deliveries.size).to eq(1)
    expect(ActionMailer::Base.deliveries.sole.to).to eq([interviewer.email])
    expect(ActionMailer::Base.deliveries.sole.body.encoded).not_to include("PRIVATE")
  end

  it "blocks a queued manual retry if its Admin loses authority" do
    message.update!(state: "failed", error_code: "transport_rejected")
    actor = create(:user, current_workspace: company)
    create(:employment, company:, user: actor, resigned_at: nil)
    actor.add_role(:admin, company)
    instance = described_class.new(feedback:, actor:)
    intent = instance.preview!(kind: message.kind, mailbox_id: mailbox.id).fetch("intent")
    record = instance.queue!(attributes: intent, retry_of: message, message_version: message.lock_version).first
    actor.remove_role(:admin, company)
    HiringDeliveryJob.perform_now(record.id)
    expect(record.reload).to have_attributes(state: "failed", error_code: "permission_changed")
  end

  %w[feedback_overdue feedback_received].each do |kind|
    it "recovers a recorded #{kind} notice" do
      if kind == "feedback_overdue"
        travel_to(booking.feedback_due_at + 1.second)
      else
        Hiring::FeedbackSubmission.new(feedback:, actor: interviewer).submit!(attributes: {
          "company_id" => company.id, "application_version" => application.reload.lock_version,
          "interview_version" => round.reload.lock_version, "booking_version" => booking.lock_version,
          "feedback_version" => feedback.lock_version, "request_key" => SecureRandom.uuid,
          "details" => { "interview_on" => "2026-11-09", "attendance" => "attended", "topics" => "PRIVATE TOPICS",
            "assessment" => "PRIVATE ASSESSMENT", "technical_skills" => "", "communication" => "PRIVATE COMMUNICATION",
            "strengths" => "", "concerns" => "", "evidence" => "PRIVATE EVIDENCE", "recommendation" => "pass", "answers" => ["PRIVATE ANSWER"] }
        })
      end
      HiringFeedbackRequestsJob.perform_now
      record = company.hiring_messages.find_by!(kind:)
      record.update!(state: "failed", error_code: "transport_rejected")
      intent = communication.preview!(kind:, mailbox_id: mailbox.id).fetch("intent")
      expect(retry_message(intent, record)).to have_attributes(kind:, original_message_id: record.id, attempt_number: 2)
    end
  end
end
