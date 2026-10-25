# frozen_string_literal: true

module Hiring
  class Acknowledgement
    def initialize(receipt:, actor: nil)
      @receipt, @actor = receipt, actor
      @company = receipt.company
    end

    def queue
      return queue_approved unless @actor

      @actor.with_lock do
        authorize_actor!
        queue_approved
      end
    end

    def queue_existing!(lock_version:, approved_setting_version:, recipient:)
      with_confirmed_receipt(lock_version:, approved_setting_version:, recipient:) do
        queue_confirmed(approved_setting_version:, recipient:)
      end
    end

    def retry!(message:, message_lock_version:, lock_version:, approved_setting_version:, recipient:)
      with_confirmed_receipt(lock_version:, approved_setting_version:, recipient:) do
        with_current_message(message, message_lock_version) do
          unless message.retryable? && message.attempts.order(attempt_number: :desc).first.id == message.id
            raise Intake::Conflict, "Review the latest attempt and reconcile any unknown delivery before retrying."
          end
          queue_confirmed(approved_setting_version:, recipient:, retry_of: message)
        end
      end
    end

    def reconcile!(message:, lock_version:, outcome:, evidence:, worker_stopped:)
      unless %w[accepted not_accepted].include?(outcome) && evidence.is_a?(String) && evidence.strip.length.between?(1, 2000) &&
          !evidence.include?("\0") && [true, false].include?(worker_stopped) && (outcome != "not_accepted" || worker_stopped)
        raise Intake::InvalidInput, "Record provider evidence; non-acceptance also requires confirming the original worker has stopped."
      end
      raise Pundit::NotAuthorizedError unless @actor

      @actor.with_lock do
        authorize_actor!
        @receipt.with_lock do
          with_current_message(message, lock_version) do
            unless message.state == "uncertain" && message.resolution.nil?
              raise Intake::Conflict, "Only an unresolved unknown delivery can be reconciled. Reload its current status."
            end
            Audited.audit_class.as_user(@actor) do
              message.update!(resolution: outcome, resolution_details: { "evidence" => evidence.strip, "worker_stopped" => worker_stopped },
                resolved_by: @actor, resolved_at: Time.current)
            end
            message
          end
        end
      end
    end

    private

      def with_confirmed_receipt(lock_version:, approved_setting_version:, recipient:)
        unless [lock_version, approved_setting_version].all? { |version| version.is_a?(Integer) && version >= 0 } && recipient.is_a?(String)
          raise Intake::InvalidInput, "Confirm the current recipient and approved message before queuing."
        end
        raise Pundit::NotAuthorizedError unless @actor

        @actor.with_lock do
          authorize_actor!
          @receipt.with_lock do
            unless @receipt.lock_version == lock_version && @receipt.state == "accepted"
              raise Intake::Conflict, "This email changed. Reload before queuing an acknowledgement."
            end
            yield
          end
        end
      end

      def with_current_message(message, lock_version)
        unless lock_version.is_a?(Integer) && lock_version >= 0
          raise Intake::InvalidInput, "Reload the current message attempt before continuing."
        end
        @company.with_lock do
          message.with_lock do
            unless message.company_id == @company.id && message.hiring_application_id == @receipt.hiring_application_id
              raise Pundit::NotAuthorizedError
            end
            raise Intake::Conflict, "This attempt changed. Reload its current status." unless message.lock_version == lock_version

            yield
          end
        end
      end

      def queue_confirmed(approved_setting_version:, recipient:, retry_of: nil)
        queue_approved(expected_setting_version: approved_setting_version, expected_recipient: recipient, retry_of:) ||
          raise(Intake::InvalidInput, "An approved message, enabled original inbox and open application are required.")
      end

      def authorize_actor!
        unless @actor.current_workspace_id == @company.id && HiringPolicy.new(@actor, HiringApplication).create?
          raise Pundit::NotAuthorizedError
        end
      end

      def queue_approved(expected_setting_version: nil, expected_recipient: nil, retry_of: nil)
        @company.with_lock do
          @receipt.reload
          setting = @company.hiring_setting&.reload
          if expected_setting_version && setting&.lock_version != expected_setting_version
            raise Intake::Conflict, "The communication settings changed. Reload the approved message."
          end
          next unless setting&.approved? && @receipt.state == "accepted" && @receipt.hiring_application_id

          application, mailbox = @receipt.hiring_application, @receipt.hiring_mailbox
          next unless mailbox.active? && @receipt.details["source_email"] == mailbox.source_email
          next if %w[withdrawn rejected hired].include?(application.stage)
          if expected_recipient && application.hiring_candidate.email != expected_recipient
            raise Intake::Conflict, "The applicant email changed. Reload and confirm the current recipient."
          end

          attributes = { hiring_setting: setting, approved_setting_version: setting.lock_version,
            queued_by: @actor, content: snapshot(setting, application, mailbox) }
          message = Audited.audit_class.as_user(@actor) do
            if retry_of
              @company.hiring_messages.create!(**attributes, hiring_application: application, kind: "acknowledgement",
                original_message_id: retry_of.original_message_id || retry_of.id, attempt_number: retry_of.attempt_number + 1)
            else
              @company.hiring_messages.operations.find_or_create_by!(hiring_application: application, kind: "acknowledgement") do |record|
                record.assign_attributes(attributes)
              end
            end
          end
          ActiveRecord.after_all_transactions_commit { message.enqueue }
          message
        end
      end

      def snapshot(setting, application, mailbox)
        { "to" => application.hiring_candidate.email, "reply_to" => mailbox.source_email,
          "mailbox_id" => mailbox.id, "actor_id" => @actor&.id,
          "subject" => setting.details.fetch("acknowledgement_subject"), "body" => setting.acknowledgement_text }
      end
  end
end
