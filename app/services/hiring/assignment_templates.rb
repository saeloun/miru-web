# frozen_string_literal: true

module Hiring
  class AssignmentTemplates
    KEYS = %w[company_id title skills experience role_id details lock_version].freeze

    def initialize(company:, actor:, attributes:)
      @company, @actor, @attributes = company, actor, attributes
    end

    def process(template: nil, action: "save")
      @actor.with_lock do
        unless @actor.current_workspace_id == @company.id && HiringPolicy.new(@actor, HiringApplication).create?
          raise Pundit::NotAuthorizedError
        end
        @company.with_lock do
          @template = template || @company.hiring_assignment_templates.build(details: {})
          raise Pundit::NotAuthorizedError unless @template.company_id == @company.id

          @template.persisted? ? @template.with_lock { write!(action) } : write!(action)
        end
      end
    rescue ActiveRecord::RecordInvalid
      raise Intake::InvalidInput, "Use valid task details, an effort of 1–10,080 minutes and a role in this workspace."
    end

    private

      def write!(action)
        unless @attributes.is_a?(Hash) && (@attributes.keys - KEYS).empty? && @attributes["company_id"].to_s == @company.id.to_s
          raise Intake::InvalidInput, "Use valid task details in this workspace."
        end
        if @template.persisted? && (!@attributes["lock_version"].is_a?(Integer) || @attributes["lock_version"] != @template.lock_version)
          raise Intake::Conflict, "This task changed. Reload before saving or approving."
        end
        case action
        when "save"
          unless @attributes.slice("title", "skills", "experience").values.all? { |value| value.is_a?(String) }
            raise Intake::InvalidInput, "Use text for task title, skills and experience."
          end
          if @attributes.key?("details") && !@attributes["details"].is_a?(Hash)
            raise Intake::InvalidInput, "Use valid task details."
          end
          @template.assign_attributes(@attributes.slice("title", "skills", "experience", "details"))
          @template.hiring_role = selected_role if @attributes.key?("role_id")
          @template.status = "draft"
        when "approve"
          unless @template.valid? && @template.complete? && (!@template.hiring_role || @template.hiring_role.status == "open")
            raise Intake::InvalidInput, "Complete instructions, criteria, effort, submission method and AI policy; choose an open role before approval."
          end
          @template.status = "approved"
        when "archive"
          @template.status = "archived"
        else
          raise Intake::InvalidInput, "Choose a valid task action."
        end
        raise Intake::InvalidInput, "No task changes to save." if @template.persisted? && !@template.changed?

        @template.save!
        @template.revisions.create!(company: @company, created_by: @actor, template_version: @template.lock_version,
          snapshot: @template.review_details.merge(actor_name: @actor.full_name))
        @template
      end

      def selected_role
        value = @attributes["role_id"]
        return nil if value.nil?
        unless (value.is_a?(Integer) || value.is_a?(String)) && value.to_s.match?(/\A[1-9]\d{0,18}\z/)
          raise Intake::InvalidInput, "Choose a valid role in this workspace."
        end
        return @template.hiring_role if @template.hiring_role_id == value.to_i

        @company.hiring_roles.find_by(id: value, status: "open") || raise(Intake::InvalidInput, "Choose an open role in this workspace.")
      end
  end
end
