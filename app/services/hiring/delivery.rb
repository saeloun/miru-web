# frozen_string_literal: true

module Hiring
  class Delivery
    def initialize(message)
      @message = message
    end

    def deliver
      # Commit the sending claim before SMTP, including when invoked outside a worker.
      raise ActiveRecord::ActiveRecordError, "Hiring delivery cannot run inside a transaction" if HiringMessage.connection.transaction_open?

      claimed = @message.with_lock do
        if @message.state == "sending" && @message.started_at && @message.started_at <= 15.minutes.ago
          @message.update!(state: "uncertain", error_code: "interrupted")
        end
        next false unless @message.state == "queued"

        next false unless permitted_to_send?
        @message.update!(state: "sending", started_at: Time.current, error_code: nil)
        true
      end
      send_message if claimed
      @message
    end

    private

      def permitted_to_send?
        reason = blocked_reason
        return true unless reason

        @message.update!(state: "failed", error_code: reason)
        false
      end

      def blocked_reason
        if @message.original_message_id && @message.attempts.where("attempt_number < ?", @message.attempt_number).any? { |attempt| !attempt.retryable? }
          return "previous_attempt_changed"
        end
        setting = @message.hiring_setting.reload
        return "approval_changed" unless setting.company_id == @message.company_id && setting.approved? &&
          setting.lock_version == @message.approved_setting_version

        actor_id = @message.content["actor_id"]
        return "permission_changed" if actor_id && !HiringPolicy.administrators(@message.company).where(user_id: actor_id).exists?

        mailbox = @message.company.hiring_mailboxes.find_by(id: @message.content["mailbox_id"], active: true)
        return "source_changed" unless mailbox && mailbox.source_email == @message.content["reply_to"]

        application = @message.hiring_application.reload
        return "application_closed" if %w[withdrawn rejected hired].include?(application.stage)
        return "recipient_changed" unless application.hiring_candidate.reload.email == @message.content["to"]

        if (access_id = @message.content["portal_access_id"])
          access = application.hiring_portal_accesses.find_by(id: access_id)
          return "portal_unavailable" unless access&.active?
        end

        nil
      end

      def send_message
        mail = HiringMailer.acknowledgement(@message.id)
        unless mail.message.perform_deliveries
          record_outcome(state: "failed", error_code: "delivery_disabled")
          return
        end
        mail.message.raise_delivery_errors = true
        return unless @message.with_lock { @message.state == "sending" && permitted_to_send? }

        begin
          mail.deliver_now
        rescue Postmark::InactiveRecipientError
          record_outcome(state: "failed", error_code: "transport_rejected")
        rescue StandardError
          # SMTP status errors can follow DATA acceptance during QUIT; the exception has no phase.
          record_outcome(state: "uncertain", error_code: "transport_unknown")
        else
          record_outcome(state: "sent", sent_at: Time.current, error_code: nil)
        end
      end

      def record_outcome(**attributes)
        @message.with_lock do
          @message.update!(**attributes) if %w[sending uncertain].include?(@message.state)
        end
      end
  end
end
