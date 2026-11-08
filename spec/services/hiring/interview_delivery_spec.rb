# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Interview message delivery" do
  before do
    DatabaseCleaner.clean
    DatabaseCleaner.strategy = :deletion
    DatabaseCleaner.start
  end

  include_context "interview message records"

  before do
    approve
    ActionMailer::Base.deliveries.clear
    allow(HiringMailer).to receive(:acknowledgement).and_wrap_original do |original, *arguments|
      original.call(*arguments).tap do |mail|
        mail.message.delivery_method(:test)
        mail.message.perform_deliveries = true
      end
    end
  end

  def queue_message(booked: true)
    selected_booking = booking if booked
    service = Hiring::InterviewCommunication.new(interview: round, booking: selected_booking, actor: admin)
    preview = service.preview!(kind: "interview_invitation", mailbox_id: mailbox.id)
    message, created = service.queue!(attributes: preview.fetch("intent"))
    expect(created).to be(true)
    message
  end

  it "uses the existing transport once with only the frozen candidate content" do
    message = queue_message
    2.times { HiringDeliveryJob.perform_now(message.id) }
    expect(message.reload.state).to eq("sent")
    mail = ActionMailer::Base.deliveries.sole
    expect(mail.to).to eq(["candidate@example.test"])
    expect(mail.reply_to).to eq([mailbox.source_email])
    expect(mail.body.decoded).to include("Bring a project", "Asia/Kolkata", "2026-11-09")
    expect(mail.body.decoded).not_to include("PRIVATE", "compensation_access", "feedback_due")
    expect(message.sent_at).to be_present
  end

  {
    "approval_changed" => -> { company.hiring_setting.update!(details: company.hiring_setting.details.merge("interview_invitation_body" => "Unapproved change")) },
    "source_changed" => -> { mailbox.update!(active: false) },
    "recipient_changed" => -> { application.hiring_candidate.update!(email: "changed@example.test") },
    "application_closed" => -> { application.update!(stage: "withdrawn") },
    "interview_changed" => -> { booking.end!(status: "cancelled", reason: "PRIVATE cancellation") },
    "panel_changed" => -> { round.hiring_access_grants.active.update_all(revoked_at: Time.current) }
  }.each do |reason, change|
    it "blocks #{reason} before sending and does not retry it automatically" do
      message = queue_message
      instance_exec(&change)
      2.times { HiringDeliveryJob.perform_now(message.id) }
      expect(message.reload.state).to eq("failed")
      expect(message.error_code).to eq(reason)
      expect(ActionMailer::Base.deliveries).to be_empty
    end
  end

  it "rechecks the interview after building the mail and before transport" do
    message = queue_message
    allow(HiringMailer).to receive(:acknowledgement).and_wrap_original do |original, *arguments|
      original.call(*arguments).tap do |mail|
        mail.message.delivery_method(:test)
        mail.message.perform_deliveries = true
        booking.end!(status: "cancelled", reason: "PRIVATE late cancellation")
      end
    end
    HiringDeliveryJob.perform_now(message.id)
    expect(message.reload.state).to eq("failed")
    expect(message.error_code).to eq("interview_changed")
    expect(ActionMailer::Base.deliveries).to be_empty
  end

  it "delivers an unbooked invitation once without inventing a confirmed time" do
    message = queue_message(booked: false)
    2.times { HiringDeliveryJob.perform_now(message.id) }
    expect(message.reload.state).to eq("sent")
    mail = ActionMailer::Base.deliveries.sole
    expect(mail.body.decoded).to include("No interview time is confirmed", "reply to the hiring team")
    expect(mail.body.decoded).not_to include("PRIVATE", "Time:", "2026-")
    expect(HiringInterviewBooking.count).to eq(0)
  end

  it "blocks an unbooked invitation after a meeting is recorded" do
    message = queue_message(booked: false)
    booking
    HiringDeliveryJob.perform_now(message.id)
    expect(message.reload.state).to eq("failed")
    expect(message.error_code).to eq("interview_changed")
    expect(ActionMailer::Base.deliveries).to be_empty
  end

  it "rechecks unbooked profile identity and version after constructing the mail" do
    message = queue_message(booked: false)
    allow(HiringMailer).to receive(:acknowledgement).and_wrap_original do |original, *arguments|
      original.call(*arguments).tap do |mail|
        mail.message.delivery_method(:test)
        mail.message.perform_deliveries = true
        panel.update!(details: panel.details.merge("booking_url" => "https://calendar.example.test/changed"))
      end
    end
    HiringDeliveryJob.perform_now(message.id)
    expect(message.reload.state).to eq("failed")
    expect(message.error_code).to eq("panel_changed")
    expect(ActionMailer::Base.deliveries).to be_empty
  end
end
