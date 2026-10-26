# frozen_string_literal: true

module Hiring
  class Screening
    KEYS = %w[company_id lock_version action role_id owner_employment_id reason].freeze

    def initialize(application:, actor:, attributes:)
      @application, @actor, @attributes = application, actor, attributes
      @company = application.company
    end

    def process
      @actor.with_lock do
        unless @actor.current_workspace_id == @company.id && HiringPolicy.new(@actor, @application).update?
          raise Pundit::NotAuthorizedError
        end
        @company.with_lock do
          @application.with_lock do
            validate_input!
            before = assignment_details
            role = selected_role
            owner = selected_owner
            stage = HiringScreening::STAGES.fetch(@attributes["action"]) || @application.stage
            @application.assign_attributes(hiring_role: role, owner_employment: owner, stage:)
            if @attributes["action"] == "update_details" && !@application.changed?
              raise Intake::InvalidInput, "Choose a different role or hiring owner."
            end
            Audited.audit_class.as_user(@actor) { @application.save! }
            # Repeated requests at the same stage still need a new optimistic version.
            @application.touch if @application.saved_changes.empty?
            @application.hiring_screenings.create!(company: @company, created_by: @actor,
              action: @attributes["action"], from_stage: before.fetch("stage"), to_stage: stage,
              application_version: @application.lock_version,
              details: { "reason" => @attributes["reason"]&.strip.presence, "actor_name" => @actor.full_name,
                         "before" => before, "after" => assignment_details })
          end
        end
      end
    rescue ActiveRecord::RecordInvalid
      raise Intake::InvalidInput, "Use valid screening details in this workspace."
    end

    private

      def validate_input!
        unless @attributes.is_a?(Hash) && (@attributes.keys - KEYS).empty? && HiringScreening::STAGES.key?(@attributes["action"])
          raise Intake::InvalidInput, "Choose a valid screening action."
        end
        unless identity(@attributes["company_id"]) == @company.id
          raise Intake::Conflict, "The hiring workspace changed. Reload before saving."
        end
        version = @attributes["lock_version"]
        unless version.is_a?(Integer) && version >= 0 && version == @application.lock_version
          raise Intake::Conflict, "This application changed. Reload before screening."
        end
        if %w[hired rejected withdrawn].include?(@application.stage)
          raise Intake::InvalidInput, "This application is closed."
        end
        reason = @attributes["reason"]
        unless reason.nil? || reason.is_a?(String) && reason.length <= 10_000 && !reason.include?("\0")
          raise Intake::InvalidInput, "Use a screening reason of at most 10,000 characters."
        end
        if %w[request_information reject].include?(@attributes["action"]) && reason&.strip.blank?
          raise Intake::InvalidInput, "Record the reason before requesting information or rejection."
        end
      end

      def selected_role
        return @application.hiring_role unless @attributes.key?("role_id")

        id = identity(@attributes["role_id"])
        return nil unless id
        return @application.hiring_role if id == @application.hiring_role_id

        @company.hiring_roles.find_by(id:, status: "open") || raise(Intake::InvalidInput, "Choose an open role in this workspace.")
      end

      def selected_owner
        return @application.owner_employment unless @attributes.key?("owner_employment_id")

        id = identity(@attributes["owner_employment_id"])
        return nil unless id
        return @application.owner_employment if id == @application.owner_employment_id

        HiringPolicy.staff_members(@company).find_by(id:) || raise(Intake::InvalidInput, "Choose an active hiring owner in this workspace.")
      end

      def identity(value)
        return nil if value.nil?
        return value.to_i if (value.is_a?(String) || value.is_a?(Integer)) && value.to_s.match?(/\A[1-9]\d{0,18}\z/)

        raise Intake::InvalidInput, "Choose valid workspace, role and staff identities."
      end

      def assignment_details
        { "stage" => @application.stage, "role" => @application.hiring_role&.slice(:id, :title),
          "owner" => @application.owner_employment&.then { |owner| { "id" => owner.id, "full_name" => owner.user.full_name } } }
      end
  end
end
