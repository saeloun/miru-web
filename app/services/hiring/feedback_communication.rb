# frozen_string_literal: true

module Hiring
  class FeedbackCommunication < MessageCommunication
    KEYS = %w[company_id kind mailbox_id mailbox_version setting_version application_version feedback_id feedback_version recipient source_message_id source_message_version].freeze

    def initialize(feedback:, actor:)
      @feedback, @actor = feedback, actor
      @booking = feedback.hiring_interview_booking
      @interview = @booking.hiring_interview
      @application = @interview.hiring_application
      @company = feedback.company
    end

    def with_context(&block)
      InterviewCommunication.new(interview: @interview, booking: @booking, actor: @actor).with_context do
        @feedback.with_lock do
          raise Pundit::NotAuthorizedError unless @feedback.company_id == @application.company_id

          block.call
        end
      end
    end

    def messages = @company.hiring_messages.where(hiring_application: @application, kind: HiringMessage::FEEDBACK_KINDS, event_key: operation_key)

    def current_operation?(message) = super && eligible?(message)

    def queue!(attributes:, retry_of: nil, message_version: nil)
      raise Intake::InvalidInput, "Only an existing internal notice can be retried." unless retry_of
      unless attributes.is_a?(Hash) && attributes["source_message_id"] == retry_of.id && attributes["source_message_version"] == message_version
        raise Intake::Conflict, "Preview the delivery attempt being retried."
      end

      super
    end

    private

      def operation_key = "feedback:#{@feedback.id}"

      def input!(attributes)
        integers = KEYS - %w[kind recipient]
        unless attributes.is_a?(Hash) && attributes.keys.sort == KEYS.sort && HiringMessage::FEEDBACK_KINDS.include?(attributes["kind"]) &&
            integers.all? { |key| attributes[key].is_a?(Integer) && attributes[key] >= 0 } && attributes["company_id"] == @company.id &&
            attributes["feedback_id"] == @feedback.id && attributes["recipient"].is_a?(String) && attributes["recipient"].length <= 254
          raise Intake::InvalidInput, "Confirm the complete internal notice retry preview."
        end
      end

      def eligible?(message)
        setting = @company.hiring_setting&.reload
        mailbox = @company.hiring_mailboxes.find_by(id: message.content["mailbox_id"], active: true)
        setting&.approved? && setting.id == message.hiring_setting_id && setting.lock_version == message.approved_setting_version &&
          setting.details["feedback_mailbox_id"] == mailbox&.id && mailbox && mailbox.source_email == message.content["reply_to"] &&
          FeedbackNotifications.blocked_reason(message).nil?
      end

      def current_preview(kind, mailbox_id)
        unless HiringMessage::FEEDBACK_KINDS.include?(kind) && mailbox_id.is_a?(Integer) && mailbox_id.positive?
          raise Intake::InvalidInput, "Choose a recorded internal notice and its approved inbox."
        end
        root = messages.operations.find_by!(kind:)
        latest = root.attempts.order(attempt_number: :desc).first
        unless latest.retryable? && eligible?(latest) && latest.content["mailbox_id"] == mailbox_id
          raise Intake::Conflict, "This internal notice cannot be retried. Review its delivery evidence and current approval, inbox and recipient."
        end
        mailbox = @company.hiring_mailboxes.find(mailbox_id)
        intent = { "company_id" => @company.id, "kind" => kind, "mailbox_id" => mailbox.id, "mailbox_version" => mailbox.lock_version,
          "setting_version" => latest.approved_setting_version, "application_version" => @application.lock_version,
          "feedback_id" => @feedback.id, "feedback_version" => @feedback.lock_version, "recipient" => latest.content.fetch("to"),
          "source_message_id" => latest.id, "source_message_version" => latest.lock_version }
        latest.content.slice("feedback_id", "recipient_user_id", "approval_actor_id", "mailbox_id", "to", "reply_to", "subject", "body")
          .merge("intent" => intent, "automatic" => false)
      end
  end
end
