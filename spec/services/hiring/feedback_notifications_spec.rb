# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Approved internal feedback notifications" do
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

  def enable_notifications = enable_feedback_notifications

  def collect
    HiringFeedbackRequestsJob.perform_now
    HiringMessage.where(kind: %w[feedback_prompt feedback_overdue feedback_received]).order(:id)
  end

  def at_end
    travel_to(booking.ends_at + 1.minute)
  end

  def submit_feedback
    feedback = booking.hiring_feedbacks.sole
    Hiring::FeedbackSubmission.new(feedback:, actor: interviewer).submit!(attributes: {
      "company_id" => company.id, "application_version" => application.reload.lock_version,
      "interview_version" => round.reload.lock_version, "booking_version" => booking.lock_version,
      "feedback_version" => feedback.lock_version, "request_key" => SecureRandom.uuid,
      "details" => { "interview_on" => "2026-11-09", "attendance" => "attended", "topics" => "PRIVATE TOPICS",
        "assessment" => "PRIVATE ASSESSMENT", "technical_skills" => "", "communication" => "PRIVATE COMMUNICATION",
        "strengths" => "", "concerns" => "", "evidence" => "PRIVATE EVIDENCE", "recommendation" => "pass", "answers" => ["PRIVATE ANSWER"] }
    })
  end

  it "defaults to no automatic internal mail" do
    approve
    at_end
    expect(collect).to be_empty
  end

  it "requires complete approved templates and an active company inbox to opt in" do
    setting = approve
    configuration = Hiring::Configure.new(company:, actor: admin)
    expect do
      configuration.save_draft!(details: setting.details.merge("feedback_notifications_enabled" => true), lock_version: setting.lock_version)
    end.to raise_error(Hiring::Intake::InvalidInput)
    expect(company.reload.hiring_setting.feedback_notifications_started_at).to be_nil
  end

  it "queues one prompt after the interview ends and one overdue reminder, never both on late discovery" do
    enable_notifications
    booking
    expect(collect).to be_empty
    at_end
    2.times { collect }
    expect(collect.pluck(:kind)).to eq(["feedback_prompt"])
    expect(collect.sole.queued_by_id).to be_nil
    expect(collect.sole.content["approval_actor_id"]).to eq(admin.id)
    HiringDeliveryJob.perform_now(collect.sole.id)
    expect(ActionMailer::Base.deliveries.sole.to).to eq([interviewer.email])
    expect(ActionMailer::Base.deliveries.sole.body.decoded).to include("Feedback due (UTC)", "Project discussion")
    expect(ActionMailer::Base.deliveries.sole.body.decoded).not_to include("PRIVATE", "candidate@example.test")
    travel_to(booking.feedback_due_at + 1.second)
    2.times { collect }
    expect(collect.pluck(:kind)).to eq(%w[feedback_prompt feedback_overdue])
    HiringDeliveryJob.perform_now(collect.last.id)
    expect(ActionMailer::Base.deliveries.size).to eq(2)
  end

  it "skips a superseded prompt when first discovered overdue" do
    enable_notifications
    travel_to(booking.feedback_due_at + 1.second)
    expect(collect.pluck(:kind)).to eq(["feedback_overdue"])
  end

  it "does not mail the backlog on enable or re-enable, and retains the activation cutoff across edits" do
    booking
    travel 1.second
    setting = enable_notifications
    cutoff = setting.feedback_notifications_started_at
    at_end
    expect(collect).to be_empty
    configuration = Hiring::Configure.new(company:, actor: admin)
    setting = configuration.save_draft!(details: setting.details.merge("feedback_prompt_body" => "Updated approved text"), lock_version: setting.lock_version)
    setting = configuration.approve!(lock_version: setting.lock_version)
    expect(setting.feedback_notifications_started_at).to eq(cutoff)
    setting = configuration.save_draft!(details: setting.details.merge("feedback_notifications_enabled" => false), lock_version: setting.lock_version)
    expect(setting.feedback_notifications_started_at).to be_nil
    travel 1.second
    setting = configuration.save_draft!(details: setting.details.merge("feedback_notifications_enabled" => true), lock_version: setting.lock_version)
    setting = configuration.approve!(lock_version: setting.lock_version)
    expect(setting.feedback_notifications_started_at).to be > cutoff
    expect(collect).to be_empty
  end

  it "notifies the approving Admin once after submission without mailing private feedback or deciding the application" do
    enable_notifications
    at_end
    submit_feedback
    2.times { collect }
    message = collect.sole
    expect(message.kind).to eq("feedback_received")
    HiringDeliveryJob.perform_now(message.id)
    mail = ActionMailer::Base.deliveries.sole
    expect(mail.to).to eq([admin.email])
    expect(mail.body.decoded).to include("Feedback received", "Review the recommendation in Miru")
    expect(mail.body.decoded).to include("Interviewer recommends Pass", "ready for Admin review of the next stage")
    expect(mail.body.decoded).not_to include("PRIVATE", "candidate@example.test")
    expect(application.reload.stage).to eq("interview")
  end

  {
    "approval_changed" => -> { company.hiring_setting.update!(details: company.hiring_setting.details.merge("feedback_prompt_body" => "Unapproved change")) },
    "source_changed" => -> { mailbox.update!(active: false) },
    "recipient_changed" => -> { interviewer.skip_reconfirmation!; interviewer.update!(email: "changed@example.test") },
    "application_closed" => -> { application.update!(stage: "withdrawn") },
    "feedback_unavailable" => -> { booking.end!(status: "cancelled", reason: "Cancelled") },
    "reviewer_changed" => -> { staff.update!(resigned_at: Date.yesterday) }
  }.each do |reason, change|
    it "blocks #{reason} before transport without automatically retrying" do
      enable_notifications
      at_end
      message = collect.sole
      instance_exec(&change)
      2.times { HiringDeliveryJob.perform_now(message.id) }
      collect
      expect(message.reload.state).to eq("failed")
      expect(message.error_code).to eq(reason)
      expect(ActionMailer::Base.deliveries).to be_empty
      expect(HiringMessage.where(kind: "feedback_prompt").count).to eq(1)
    end
  end

  it "suppresses pending prompts after submission" do
    enable_notifications
    at_end
    message = collect.sole
    submit_feedback
    HiringDeliveryJob.perform_now(message.id)
    expect(message.reload.error_code).to eq("feedback_changed")
    expect(ActionMailer::Base.deliveries).to be_empty
  end

  it "suppresses a delayed prompt once its overdue reminder becomes due" do
    enable_notifications
    at_end
    message = collect.sole
    travel_to(booking.feedback_due_at)
    HiringDeliveryJob.perform_now(message.id)
    expect(message.reload.error_code).to eq("feedback_changed")
    expect(collect.pluck(:kind)).to eq(%w[feedback_prompt feedback_overdue])
    expect(ActionMailer::Base.deliveries).to be_empty
  end

  it "does not turn old bookings into a new backlog when missing feedback requests are repaired" do
    booking.hiring_feedbacks.delete_all
    travel 1.second
    enable_notifications
    at_end
    expect(collect).to be_empty
    expect(booking.hiring_feedbacks.count).to eq(1)
  end

  it "rejects another workspace's inbox at approval" do
    setting = enable_notifications
    foreign = HiringMailbox.create!(company: create(:company), name: "Other", source_email: "other@example.test")
    configuration = Hiring::Configure.new(company:, actor: admin)
    setting = configuration.save_draft!(details: setting.details.merge("feedback_mailbox_id" => foreign.id), lock_version: setting.lock_version)
    expect { configuration.approve!(lock_version: setting.lock_version) }.to raise_error(Hiring::Intake::InvalidInput)
    expect(collect).to be_empty
  end

  it "never queues the Admin's feedback notice when approval or Admin membership is lost" do
    enable_notifications
    at_end
    submit_feedback
    message = collect.sole
    admin.remove_role(:admin, company)
    HiringDeliveryJob.perform_now(message.id)
    expect(message.reload.error_code).to eq("approval_changed")
    expect(ActionMailer::Base.deliveries).to be_empty
  end

  it "rechecks reviewer authorization after constructing mail" do
    enable_notifications
    at_end
    message = collect.sole
    allow(HiringMailer).to receive(:acknowledgement).and_wrap_original do |original, *arguments|
      original.call(*arguments).tap do |mail|
        mail.message.delivery_method(:test)
        mail.message.perform_deliveries = true
        staff.update!(resigned_at: Date.yesterday)
      end
    end
    HiringDeliveryJob.perform_now(message.id)
    expect(message.reload.error_code).to eq("reviewer_changed")
    expect(ActionMailer::Base.deliveries).to be_empty
  end

  it "keeps an ambiguous transport outcome uncertain and does not resubmit it on job recovery" do
    enable_notifications
    at_end
    message = collect.sole
    allow_any_instance_of(ActionMailer::MessageDelivery).to receive(:deliver_now).and_raise(IOError, "private provider response")
    HiringDeliveryJob.perform_now(message.id)
    2.times { collect; HiringDeliveryJob.perform_now(message.id) }
    expect(message.reload.state).to eq("uncertain")
    expect(message.error_code).to eq("transport_unknown")
    expect(HiringMessage.where(kind: "feedback_prompt").count).to eq(1)
  end

  it "records one operation when two schedulers race on the same feedback request" do
    enable_notifications
    at_end
    id = booking.hiring_feedbacks.sole.id
    ready = Queue.new
    start = Queue.new
    threads = 2.times.map do
      Thread.new do
        ActiveRecord::Base.connection_pool.with_connection do
          ready << true
          start.pop
          Hiring::FeedbackNotifications.new(HiringFeedback.find(id)).queue!
        end
      end
    end
    2.times { ready.pop }
    2.times { start << true }
    results = threads.map(&:value)
    expect(results.compact.size).to eq(1)
    expect(HiringMessage.where(kind: "feedback_prompt").count).to eq(1)
  ensure
    threads&.each { |thread| thread.join(5) }
  end
end
