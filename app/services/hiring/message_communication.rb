# frozen_string_literal: true

module Hiring
  class MessageCommunication
    def current_operation?(message) = message.event_key == operation_key

    def preview!(kind:, mailbox_id:)
      with_context { current_preview(kind, mailbox_id) }
    end

    def queue!(attributes:, retry_of: nil, message_version: nil)
      with_context do
        input!(attributes)
        if !retry_of && (existing = messages.operations.find_by(event_key: operation_key_from_intent(attributes), kind: attributes["kind"]))
          raise Intake::Conflict, "This message already has different confirmed intent. Review its history." unless existing.content["intent"] == attributes

          next [existing, false]
        end
        if retry_of
          current_message!(retry_of, message_version)
          unless current_operation?(retry_of) && retry_of.kind == attributes["kind"] && retry_of.retryable? && retry_of.attempts.order(attempt_number: :desc).first.id == retry_of.id
            raise Intake::Conflict, "Review the latest attempt and reconcile any unknown delivery before retrying."
          end
        end
        preview = current_preview(attributes["kind"], attributes["mailbox_id"])
        raise Intake::Conflict, "The recipient, approval, inbox or saved details changed. Preview again before sending." unless preview.fetch("intent") == attributes

        prepare_queue!
        message = Audited.audit_class.as_user(@actor) do
          messages.create!(event_key: operation_key, kind: attributes["kind"], hiring_setting: HiringSetting.find_by!(company: @company),
            approved_setting_version: attributes.fetch("setting_version"), queued_by: @actor, content: preview.merge("actor_id" => @actor.id),
            original_message_id: retry_of && (retry_of.original_message_id || retry_of.id), attempt_number: retry_of ? retry_of.attempt_number + 1 : 1)
        end
        ActiveRecord.after_all_transactions_commit { message.enqueue }
        [message, true]
      end
    end

    def reconcile!(message:, message_version:, outcome:, evidence:, worker_stopped:)
      with_context do
        current_message!(message, message_version)
        message.record_delivery_review!(actor: @actor, outcome:, evidence:, worker_stopped:)
      end
    end

    private

      def operation_key_from_intent(_attributes) = operation_key

      def prepare_queue!; end

      def current_message!(message, version)
        message.lock!
        raise Pundit::NotAuthorizedError unless messages.exists?(id: message.id)
        raise Intake::Conflict, "This delivery attempt changed. Reload its current status." unless version.is_a?(Integer) && version == message.lock_version
      end
  end
end
