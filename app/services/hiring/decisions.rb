# frozen_string_literal: true

module Hiring
  class Decisions
    CREATE_KEYS = %w[company_id application_version request_key outcome reason owner_employment_id follow_up_on].freeze
    UPDATE_KEYS = (CREATE_KEYS - ["request_key"] + ["decision_version"]).freeze
    FINALIZE_KEYS = %w[company_id application_version decision_version].freeze
    STAGES = { "pass" => "final_decision", "reject" => "rejected", "hold" => "on_hold", "additional_round_required" => "interview" }.freeze

    def initialize(application:, actor:)
      @application, @actor = application, actor
      @company = application.company
    end

    def with_application(&block)
      raise Pundit::NotAuthorizedError unless @actor

      @actor.with_lock do
        unless @actor.current_workspace_id == @company.id && HiringPolicy.new(@actor, @application).update?
          raise Pundit::NotAuthorizedError
        end
        @company.with_lock("FOR NO KEY UPDATE") { @application.with_lock(&block) }
      end
    end

    def create!(attributes:)
      with_application do
        input!(attributes, CREATE_KEYS)
        key = attributes["request_key"]
        raise Intake::InvalidInput, "Use a valid decision request identity." unless key.is_a?(String) && key.match?(/\A[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}\z/i)

        if (existing = @company.hiring_decisions.find_by(request_key: key))
          unless existing.hiring_application_id == @application.id && existing.request_details == attributes
            raise Intake::Conflict, "That decision request already has different intent."
          end

          next [existing, false]
        end
        open_application!
        version!(@application, attributes["application_version"])
        if @application.hiring_decisions.exists?(state: "draft")
          raise Intake::Conflict, "Edit or finalize the existing decision draft first."
        end
        record = Audited.audit_class.as_user(@actor) do
          @application.hiring_decisions.create!(company: @company, created_by: @actor, request_key: key, request_details: attributes,
            details: decision_details(attributes))
        end
        @application.touch
        [record, true]
      end
    rescue ActiveRecord::RecordInvalid
      raise Intake::InvalidInput, "Use valid decision wording, outcome, owner and date."
    end

    def update!(decision:, attributes:)
      with_application do
        input!(attributes, UPDATE_KEYS)
        decision.lock!
        current_draft!(decision)
        next decision if decision.edit_details == attributes

        version!(@application, attributes["application_version"])
        version!(decision, attributes["decision_version"])
        Audited.audit_class.as_user(@actor) { decision.update!(details: decision_details(attributes), edit_details: attributes) }
        @application.touch
        decision
      end
    rescue ActiveRecord::RecordInvalid
      raise Intake::InvalidInput, "Use valid decision wording, outcome, owner and date."
    end

    def finalize!(decision:, attributes:)
      with_application do
        input!(attributes, FINALIZE_KEYS)
        decision.lock!
        matching_decision!(decision)
        if decision.state == "finalized"
          raise Intake::Conflict, "This decision was finalized with different intent." unless decision.finalization_details == attributes

          next decision
        end
        current_draft!(decision)
        version!(@application, attributes["application_version"])
        version!(decision, attributes["decision_version"])
        details = decision.details
        raise Intake::InvalidInput, "Record an internal reason before finalizing." if details["reason"].blank?

        owner = hold_owner(details) if details["outcome"] == "hold"
        Audited.audit_class.as_user(@actor) do
          decision.update!(state: "finalized", finalized_at: Time.current, finalized_by: @actor, finalization_details: attributes)
          changes = { stage: STAGES.fetch(details.fetch("outcome")) }
          changes[:owner_employment] = owner if owner
          @application.update!(**changes)
          @application.touch if @application.saved_changes.empty?
          @application.close_inactive_interviews!(actor: @actor)
          unless HiringAssignment::ACTIVE_STAGES.include?(@application.stage)
            @application.hiring_assignments.where(ended_at: nil).find_each { |assignment| assignment.cancel_for_stage!(actor: @actor) }
          end
        end
        decision
      end
    rescue ActiveRecord::RecordInvalid
      raise Intake::InvalidInput, "Complete the decision before finalizing it."
    end

    private

      def input!(attributes, keys)
        unless attributes.is_a?(Hash) && attributes.keys.sort == keys.sort && JSON.generate(attributes).bytesize <= 32.kilobytes
          raise Intake::InvalidInput, "Use complete decision parameters."
        end
        raise Intake::Conflict, "The hiring workspace changed. Reload before saving." unless attributes["company_id"] == @company.id
      end

      def version!(record, value)
        unless value.is_a?(Integer) && value >= 0 && value == record.lock_version
          raise Intake::Conflict, "This application or decision changed. Reload before confirming."
        end
      end

      def matching_decision!(decision)
        unless decision.company_id == @company.id && decision.hiring_application_id == @application.id
          raise Pundit::NotAuthorizedError
        end
      end

      def current_draft!(decision)
        matching_decision!(decision)
        unless decision.state == "draft" && @application.hiring_decisions.order(id: :desc).pick(:id) == decision.id
          raise Intake::Conflict, "Edit only the current draft; finalized history cannot be rewritten."
        end
        open_application!
      end

      def open_application!
        raise Intake::InvalidInput, "This application is closed." if %w[hired rejected withdrawn].include?(@application.stage)
      end

      def decision_details(attributes)
        outcome, reason, owner_id, follow_up = attributes.values_at("outcome", "reason", "owner_employment_id", "follow_up_on")
        unless HiringDecision::OUTCOMES.include?(outcome) && reason.is_a?(String) &&
            (owner_id.nil? || owner_id.is_a?(Integer) && owner_id.positive?) && (follow_up.nil? || follow_up.is_a?(String))
          raise Intake::InvalidInput, "Choose a valid outcome, internal reason, owner and date."
        end
        if outcome != "hold" && (owner_id || follow_up)
          raise Intake::InvalidInput, "Follow-up ownership and date apply only to a hold."
        end
        owner = HiringPolicy.staff_members(@company).find_by(id: owner_id) if owner_id
        raise Intake::InvalidInput, "Choose an active hold owner in this workspace." if owner_id && !owner

        { "outcome" => outcome, "reason" => reason.strip, "owner_employment_id" => owner_id,
          "owner_name" => owner&.user&.full_name.to_s, "follow_up_on" => follow_up, "time_zone" => @company.resolved_time_zone.tzinfo.name }
      end

      def hold_owner(details)
        owner = HiringPolicy.staff_members(@company).find_by(id: details["owner_employment_id"])
        date = Date.iso8601(details["follow_up_on"].to_s)
        today = Time.current.in_time_zone(details.fetch("time_zone")).to_date
        raise Intake::InvalidInput, "Choose an active hold owner and a follow-up date today or later." unless owner && date >= today

        owner
      rescue Date::Error
        raise Intake::InvalidInput, "Record the hold owner and follow-up date before finalizing."
      end
  end
end
