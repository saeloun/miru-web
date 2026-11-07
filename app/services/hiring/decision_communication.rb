# frozen_string_literal: true

module Hiring
  class DecisionCommunication < MessageCommunication
    KEYS = %w[company_id kind mailbox_id mailbox_version setting_version application_version decision_id decision_version recipient].freeze

    def initialize(decision:, actor:, automatic: false)
      @decision, @actor, @automatic = decision, actor, automatic
      @application = decision.hiring_application
      @company = decision.company
    end

    def with_context(&block)
      raise Pundit::NotAuthorizedError unless @actor

      @actor.with_lock do
        unless (@automatic || @actor.current_workspace_id == @company.id) && HiringPolicy.administrators(@company).exists?(user_id: @actor.id)
          raise Pundit::NotAuthorizedError
        end
        @company.with_lock("FOR NO KEY UPDATE") do
          @application.with_lock do
            @decision.with_lock do
              unless @decision.company_id == @company.id && @decision.hiring_application_id == @application.id
                raise Pundit::NotAuthorizedError
              end

              block.call
            end
          end
        end
      end
    end

    def messages = @company.hiring_messages.where(hiring_application: @application, event_key: operation_key, kind: "rejection")

    def self.eligible?(decision)
      application = decision.hiring_application
      decision.state == "finalized" && decision.details["outcome"] == "reject" && application.stage == "rejected" &&
        application.hiring_decisions.where(state: "finalized").order(id: :desc).pick(:id) == decision.id
    end

    def self.automatic?(setting, decision)
      setting.details["rejection_automation_enabled"] == true && setting.rejection_automation_started_at &&
        decision.finalized_at && decision.finalized_at > setting.rejection_automation_started_at
    end

    def self.blocked_reason(message)
      intent = message.content["intent"]
      decision = message.company.hiring_decisions.find_by(id: intent&.fetch("decision_id", nil)) if intent.is_a?(Hash)
      unless decision && decision.hiring_application_id == message.hiring_application_id && message.event_key == "decision:#{decision.id}" &&
          eligible?(decision) && [decision.lock_version, decision.hiring_application.lock_version] == intent.values_at("decision_version", "application_version")
        return "decision_changed"
      end
      if message.content["automatic"] && (!automatic?(message.hiring_setting, decision) || decision.finalized_by_id != message.content["actor_id"])
        return "automation_changed"
      end
      return "recipient_changed" unless decision.hiring_application.hiring_candidate.reload.email == message.content["to"]

      nil
    end

    private

      def operation_key = "decision:#{@decision.id}"

      def prepare_queue!
        raise Intake::InvalidInput, "Finalize the current rejection decision before sending candidate mail." unless self.class.eligible?(@decision)
      end

      def input!(attributes)
        unless attributes.is_a?(Hash) && attributes.keys.sort == KEYS.sort && attributes["kind"] == "rejection" &&
            (KEYS - %w[kind recipient]).all? { |key| attributes[key].is_a?(Integer) && attributes[key] >= 0 } &&
            attributes["company_id"] == @company.id && attributes["decision_id"] == @decision.id &&
            attributes["recipient"].is_a?(String) && attributes["recipient"].length <= 254
          raise Intake::InvalidInput, "Confirm the complete current rejection preview before sending."
        end
      end

      def current_preview(kind, mailbox_id)
        ready = self.class.eligible?(@decision)
        draft = @decision.state == "draft" && @decision.details["outcome"] == "reject" &&
          !%w[withdrawn hired rejected].include?(@application.stage) && @application.hiring_decisions.order(id: :desc).pick(:id) == @decision.id
        unless kind == "rejection" && mailbox_id.is_a?(Integer) && mailbox_id.positive? && (ready || draft)
          raise Intake::InvalidInput, "Choose the current rejection draft or finalized rejection before preparing candidate mail."
        end
        setting = @company.hiring_setting&.reload
        mailbox = @company.hiring_mailboxes.find_by(id: mailbox_id, active: true)
        unless setting&.approved? && mailbox && %w[rejection_subject rejection_body].all? { |key| setting.details[key].present? }
          raise Intake::InvalidInput, "Save and approve the rejection subject/body and choose an enabled reply inbox."
        end
        if @automatic && (!self.class.automatic?(setting, @decision) || setting.details["decision_mailbox_id"] != mailbox.id || @actor.id != @decision.finalized_by_id)
          raise Intake::InvalidInput, "Automatic rejection is not approved for this finalized decision."
        end
        intent = { "company_id" => @company.id, "kind" => kind, "mailbox_id" => mailbox.id, "mailbox_version" => mailbox.lock_version,
          "setting_version" => setting.lock_version, "application_version" => @application.lock_version,
          "decision_id" => @decision.id, "decision_version" => @decision.lock_version, "recipient" => @application.hiring_candidate.reload.email }
        { "intent" => intent, "can_queue" => ready, "automatic" => @automatic, "mailbox_id" => mailbox.id, "to" => intent.fetch("recipient"), "reply_to" => mailbox.source_email,
          "subject" => setting.details.fetch("rejection_subject"),
          "body" => [setting.details.fetch("rejection_body"), "Candidate: #{@application.submitted_name}"].join("\n\n") }
      end
  end
end
