# frozen_string_literal: true

module Hiring
  class Intake
    class InvalidInput < StandardError; end
    class Conflict < StandardError
      attr_reader :existing_application_id

      def initialize(message, existing_application_id: nil)
        @existing_application_id = existing_application_id
        super(message)
      end
    end

    KEYS = %w[company_id request_key full_name email role_id owner_employment_id notes received_at].freeze
    UUID = /\A[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\z/i

    def initialize(company:, actor:, attributes:)
      @company, @actor, @attributes = company, actor, attributes
    end

    def process
      @actor.with_lock do
        unless @actor.current_workspace_id == @company.id && HiringPolicy.new(@actor, HiringApplication).create?
          raise Pundit::NotAuthorizedError
        end
        facts, key = normalized_input
        existing = @company.hiring_applications.find_by(request_key: key)
        if existing
          check_submission!(existing, facts)
          next existing
        end
        role = @company.hiring_roles.find_by(id: facts["role_id"], status: "open") if facts["role_id"]
        owner = HiringPolicy.staff_members(@company).find_by(id: facts["owner_employment_id"]) if facts["owner_employment_id"]
        raise InvalidInput, "Choose an open role in this workspace." if facts["role_id"] && !role
        raise InvalidInput, "Choose an active staff member in this workspace." if facts["owner_employment_id"] && !owner

        candidate = @company.hiring_candidates.create_or_find_by!(email: facts.fetch("email")) do |record|
          record.full_name = facts.fetch("full_name")
        end
        application = @company.hiring_applications.create_or_find_by!(request_key: key) do |record|
          record.assign_attributes(hiring_candidate: candidate, hiring_role: role, owner_employment: owner,
            created_by: @actor, creation_details: facts, received_at: facts["received_at"] || Time.current, notes: facts["notes"])
        end
        check_submission!(application, facts)

        application.audits.create!(user: @actor, associated: @company, action: "create", audited_changes: {}) if application.previously_new_record?
        application
      end
    end

    private

      def check_submission!(application, facts)
        return if application.creation_details == facts

        raise Conflict.new("This submission was already saved with different details. Open the saved application before adding another.",
          existing_application_id: application.id)
      end

      def normalized_input
        raise InvalidInput, "Invalid application fields." unless @attributes.is_a?(Hash) && (@attributes.keys - KEYS).empty?
        raise Conflict, "The hiring workspace changed. Reload the current workspace." unless id(@attributes["company_id"]) == @company.id

        key = @attributes["request_key"]
        raise InvalidInput, "Reload the application form and try again." unless key.is_a?(String) && key.match?(UUID)
        name, email, notes = @attributes.values_at("full_name", "email", "notes")
        unless name.is_a?(String) && name.strip.length.between?(1, 200) && !name.strip.match?(/[[:cntrl:]]/) && email.is_a?(String) &&
            email.strip.bytesize <= 254 && URI::MailTo::EMAIL_REGEXP.match?(email.strip) &&
            (notes.nil? || notes.is_a?(String) && notes.length <= 10_000)
          raise InvalidInput, "Enter a name, one valid email address and notes of at most 10,000 characters."
        end
        facts = { "full_name" => name.strip, "email" => email.strip.downcase, "notes" => notes&.strip.presence,
          "role_id" => id(@attributes["role_id"]), "owner_employment_id" => id(@attributes["owner_employment_id"]),
          "received_at" => receipt_time(@attributes["received_at"]) }
        [facts, key.downcase]
      end

      def id(value)
        return nil if value.nil?
        return value.to_i if (value.is_a?(String) || value.is_a?(Integer)) && value.to_s.match?(/\A[1-9]\d{0,18}\z/)

        raise InvalidInput, "Choose a valid workspace, role or staff member."
      end

      def receipt_time(value)
        return nil if value.nil?
        unless value.is_a?(String) && value.length <= 40 && value.match?(/(?:Z|[+-]\d{2}:\d{2})\z/)
          raise InvalidInput, "Use a receipt date and time with its time zone."
        end
        timestamp = DateTime.iso8601(value).to_time.utc
        raise InvalidInput, "The application receipt time cannot be in the future." if timestamp > Time.current

        timestamp.iso8601(6)
      rescue Date::Error, ArgumentError
        raise InvalidInput, "Use a valid receipt date and time."
      end
  end
end
