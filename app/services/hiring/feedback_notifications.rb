# frozen_string_literal: true

module Hiring
  class FeedbackNotifications
    def self.queue_due
      HiringSetting.where.not(feedback_notifications_started_at: nil).find_each do |setting|
        HiringFeedback.collectible.where(company_id: setting.company_id)
          .where("hiring_feedbacks.created_at > ?", setting.feedback_notifications_started_at).find_each do |feedback|
          new(feedback).queue!
        end
      end
    end

    def self.blocked_reason(message)
      feedback = message.company.hiring_feedbacks.find_by(id: message.content["feedback_id"])
      return "feedback_unavailable" unless feedback && message.event_key == "feedback:#{feedback.id}" &&
        feedback.hiring_interview_booking.hiring_interview.hiring_application_id == message.hiring_application_id

      new(feedback).blocked_reason(message)
    end

    def initialize(feedback)
      @feedback = feedback
      @company = feedback.company
      @booking = feedback.hiring_interview_booking
      @application = @booking.hiring_interview.hiring_application
    end

    def queue!
      message = @company.with_lock("FOR NO KEY UPDATE") do
        @feedback.with_lock do
          setting = @company.hiring_setting&.reload
          next unless enabled?(setting) && @feedback.open?

          kind = current_kind
          next unless kind

          messages = @company.hiring_messages.where(hiring_application_id: @application.id, kind:, event_key: "feedback:#{@feedback.id}")
          next if messages.operations.exists?

          recipient = recipient_for(kind, setting)
          mailbox = @company.hiring_mailboxes.find_by(id: setting.details["feedback_mailbox_id"], active: true)
          next unless recipient && mailbox

          content = { "feedback_id" => @feedback.id, "recipient_user_id" => recipient.id, "to" => recipient.email,
            "mailbox_id" => mailbox.id, "reply_to" => mailbox.source_email,
            "subject" => setting.details.fetch("#{kind}_subject"), "body" => body(kind, setting) }
          @company.hiring_messages.create!(hiring_application: @application, hiring_setting: setting, kind:, event_key: "feedback:#{@feedback.id}",
            approved_setting_version: setting.lock_version, content:, queued_by: setting.approved_by)
        end
      end
      ActiveRecord.after_all_transactions_commit { message.enqueue } if message
      message
    end

    def blocked_reason(message)
      setting = message.hiring_setting
      return "approval_changed" unless enabled?(setting)
      return "feedback_unavailable" unless @feedback.open?
      return "feedback_changed" unless current_kind == message.kind

      recipient = recipient_for(message.kind, setting)
      return "reviewer_changed" unless recipient && recipient.id == message.content["recipient_user_id"]
      return "recipient_changed" unless recipient.email == message.content["to"]

      nil
    end

    private

      def enabled?(setting)
        setting && setting.details["feedback_notifications_enabled"] == true && setting.approved? &&
          setting.feedback_notifications_started_at && @feedback.created_at > setting.feedback_notifications_started_at &&
          @booking.created_at > setting.feedback_notifications_started_at
      end

      def current_kind
        return "feedback_received" if @feedback.submitted_at
        return if @booking.ends_at > Time.current

        @booking.feedback_due_at <= Time.current ? "feedback_overdue" : "feedback_prompt"
      end

      def recipient_for(kind, setting)
        if kind == "feedback_received"
          HiringPolicy.administrators(@company).find_by(user_id: setting.approved_by_id)&.user
        else
          member = @feedback.hiring_panel_member
          return unless member&.active? && member.id == @feedback.issued_panel_member_id &&
            member.employment_id == @feedback.panel_snapshot["employment_id"]

          HiringPolicy.staff_members(@company).find_by(id: member.employment_id)&.user
        end
      end

      def body(kind, setting)
        notice = kind == "feedback_received" ? "Feedback received. Review the recommendation in Miru; no decision was made automatically." :
          "Please record your interview feedback in Hiring → My feedback."
        [setting.details.fetch("#{kind}_body"), notice, "Application ##{@application.id}: #{@application.submitted_name}",
          "Round #{@booking.hiring_interview.number}: #{@booking.round_details.fetch('title')}",
          "Feedback due (UTC): #{@booking.feedback_due_at.utc.iso8601}"].join("\n\n")
      end
  end
end
