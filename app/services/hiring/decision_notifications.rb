# frozen_string_literal: true

module Hiring
  class DecisionNotifications
    def self.queue_due
      HiringSetting.where.not(rejection_automation_started_at: nil).find_each do |setting|
        setting.company.hiring_decisions.where(state: "finalized").where("finalized_at > ?", setting.rejection_automation_started_at).find_each do |decision|
          next unless decision.details["outcome"] == "reject" && decision.finalized_by && DecisionCommunication.eligible?(decision)
          next if setting.company.hiring_messages.operations.exists?(hiring_application_id: decision.hiring_application_id,
            kind: "rejection", event_key: "decision:#{decision.id}")

          communication = DecisionCommunication.new(decision:, actor: decision.finalized_by, automatic: true)
          begin
            preview = communication.preview!(kind: "rejection", mailbox_id: setting.details["decision_mailbox_id"])
            communication.queue!(attributes: preview.fetch("intent"))
          rescue Intake::InvalidInput, Intake::Conflict, Pundit::NotAuthorizedError
            next
          end
        end
      end
      HiringSetting.where.not(hold_notifications_started_at: nil).find_each do |setting|
        setting.company.hiring_applications.where(stage: "on_hold").find_each do |application|
          decision = application.hiring_decisions.where(state: "finalized").order(id: :desc).first
          new(decision).queue_hold! if decision
        end
      end
    end

    def self.blocked_reason(message)
      decision = message.company.hiring_decisions.find_by(id: message.content["decision_id"])
      return "decision_changed" unless decision && decision.hiring_application_id == message.hiring_application_id && message.event_key == "decision:#{decision.id}"

      new(decision).blocked_reason(message)
    end

    def initialize(decision)
      @decision = decision
      @company = decision.company
      @application = decision.hiring_application
    end

    def queue_hold!
      message = @company.with_lock("FOR NO KEY UPDATE") do
        @application.with_lock do
          @decision.with_lock do
            setting = @company.hiring_setting&.reload
            next unless eligible?(setting)

            scope = @company.hiring_messages.where(hiring_application: @application, kind: "hold_follow_up", event_key: "decision:#{@decision.id}")
            next if scope.operations.exists?

            recipient = HiringPolicy.administrators(@company).find_by(user_id: setting.approved_by_id)&.user
            mailbox = @company.hiring_mailboxes.find_by(id: setting.details["decision_mailbox_id"], active: true)
            next unless recipient && mailbox

            body = [setting.details.fetch("hold_follow_up_body"), "Hiring hold follow-up is due. Review this decision in Miru.",
              "Application ##{@application.id}: #{@application.submitted_name}", "Owner at decision: #{@decision.details.fetch('owner_name')}",
              "Follow-up: #{@decision.details.fetch('follow_up_on')} (#{@decision.details.fetch('time_zone')})"].join("\n\n")
            scope.create!(hiring_setting: setting, approved_setting_version: setting.lock_version,
              content: { "decision_id" => @decision.id, "recipient_user_id" => recipient.id, "to" => recipient.email,
                "automatic" => true, "approval_actor_id" => setting.approved_by_id,
                "mailbox_id" => mailbox.id, "reply_to" => mailbox.source_email, "subject" => setting.details.fetch("hold_follow_up_subject"), "body" => body })
          end
        end
      end
      ActiveRecord.after_all_transactions_commit { message.enqueue } if message
      message
    end

    def blocked_reason(message)
      return "decision_changed" unless eligible?(message.hiring_setting)

      recipient = HiringPolicy.administrators(@company).find_by(user_id: message.hiring_setting.approved_by_id)&.user
      return "permission_changed" unless recipient && recipient.id == message.content["recipient_user_id"]
      return "recipient_changed" unless recipient.email == message.content["to"]

      nil
    end

    private

      def eligible?(setting)
        return false unless setting&.approved? && setting.details["hold_notifications_enabled"] == true &&
          setting.hold_notifications_started_at && @decision.finalized_at && @decision.finalized_at > setting.hold_notifications_started_at
        return false unless @application.stage == "on_hold" && @decision.state == "finalized" && @decision.details["outcome"] == "hold" &&
          @application.hiring_decisions.where(state: "finalized").order(id: :desc).pick(:id) == @decision.id

        Time.current.in_time_zone(@decision.details.fetch("time_zone")).to_date >= Date.iso8601(@decision.details.fetch("follow_up_on"))
      end
  end
end
