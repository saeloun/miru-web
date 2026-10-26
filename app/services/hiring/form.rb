# frozen_string_literal: true

module Hiring
  class Form
    FIELD_TYPES = {
      "full_name" => "text", "email" => "email", "phone" => "text", "location" => "text", "time_zone" => "time_zone",
      "role" => "text", "total_experience" => "number", "relevant_experience" => "number", "skills" => "textarea",
      "work_summary" => "textarea", "linkedin_url" => "url", "employment_status" => "select",
      "current_role" => "text", "current_company" => "text", "notice_period" => "text", "available_from" => "date",
      "current_compensation" => "compensation", "expected_compensation" => "compensation", "resume" => "file",
      "work_samples" => "links", "availability" => "textarea"
    }.freeze
    EMPLOYMENT_STATUSES = ["Employed", "Self-employed", "Not currently employed"].freeze
    CUSTOM_TYPES = %w[text textarea email url number date select checkbox].freeze

    def self.issue!(application:, setting:, actor: nil)
      application.company.with_lock do
        setting.reload
        unless setting.company_id == application.company_id && setting.approved? && setting.form["enabled"]
          raise Intake::InvalidInput, "Approve and enable the application form before issuing a link."
        end
        application.with_lock do
          if HiringPortalAccess::CLOSED_STAGES.include?(application.stage)
            raise Intake::InvalidInput, "Reopen the application before issuing a form."
          end
          application.hiring_portal_accesses.where(revoked_at: nil).find_each { |access| access.update!(revoked_at: Time.current) }
          access = application.hiring_portal_accesses.create!(company: application.company, hiring_setting: setting,
            issued_by: actor, approved_setting_version: setting.lock_version, form_schema: setting.form,
            introduction: setting.acknowledgement_text, expires_at: 14.days.from_now)
          access.create_hiring_submission!(company: application.company, hiring_application: application, answers: {})
          application.stage == "received" ? application.update!(stage: "information_pending") : application.touch
          access
        end
      end
    end

    def self.default_schema
      fields = FIELD_TYPES.map do |id, type|
        field = { "id" => id, "label" => id.humanize, "type" => type,
                  "required" => %w[full_name email].include?(id), "sensitive" => type == "compensation" }
        field["choices"] = EMPLOYMENT_STATUSES.dup if id == "employment_status"
        field
      end
      { "enabled" => false, "fields" => fields }
    end

    def initialize(schema)
      @schema = schema
    end

    def valid?
      return false unless @schema.is_a?(Hash) && @schema.keys.sort == %w[enabled fields] && boolean?(@schema["enabled"])

      fields = @schema["fields"]
      fields.is_a?(Array) && fields.size <= 61 && fields.all? { |field| valid_field?(field) } &&
        fields.pluck("id").uniq.size == fields.size
    end

    def complete?
      valid? && (!@schema["enabled"] || (FIELD_TYPES.keys - @schema["fields"].pluck("id")).empty?)
    end

    def valid_answers?(answers, resume: false)
      return false unless answers.is_a?(Hash) && answers.to_json.bytesize <= 96.kilobytes && complete?

      fields = @schema.fetch("fields")
      return false unless (answers.keys - fields.pluck("id")).empty?

      fields.all? do |field|
        id = field.fetch("id")
        value = answers[id]
        absent = value.nil? || value == "" || value == []
        employment_missing = answers["employment_status"] == "Not currently employed" && %w[current_role current_company current_compensation].include?(id)
        if field["type"] == "file"
          value.nil? && (!field["required"] || resume)
        elsif absent
          !field["required"] || employment_missing
        else
          valid_answer?(field, value)
        end
      end
    end

    private

      def valid_answer?(field, value)
        case field.fetch("type")
        when "text", "textarea"
          text?(value, field["type"] == "text" ? 500 : 5_000)
        when "email"
          text?(value, 254) && value.match?(URI::MailTo::EMAIL_REGEXP)
        when "url"
          url?(value)
        when "links"
          value.is_a?(Array) && value.size <= 10 && value.all? { |link| url?(link) }
        when "number"
          decimal?(value)
        when "date"
          value.is_a?(String) && value.match?(/\A\d{4}-\d{2}-\d{2}\z/) && Date.iso8601(value).iso8601 == value
        when "time_zone"
          value.is_a?(String) && TZInfo::Timezone.all_identifiers.include?(value)
        when "select"
          field.fetch("choices").include?(value)
        when "checkbox"
          boolean?(value)
        when "compensation"
          value.is_a?(Hash) && value.keys.sort == %w[amount currency period] && decimal?(value["amount"]) &&
            value["currency"].is_a?(String) && value["currency"].match?(/\A[A-Z]{3}\z/) && Money::Currency.find(value["currency"]).present? &&
            %w[monthly annual].include?(value["period"])
        else
          false
        end
      rescue Date::Error, URI::InvalidURIError
        false
      end

      def decimal?(value)
        value.is_a?(String) && value.match?(/\A\d{1,20}(?:\.\d{1,6})?\z/)
      end

      def text?(value, maximum)
        value.is_a?(String) && value.valid_encoding? && value.strip.present? && value.length <= maximum &&
          !value.match?(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/)
      end

      def url?(value)
        return false unless text?(value, 2_048) && !value.match?(/[[:space:]]/)

        uri = URI.parse(value)
        %w[http https].include?(uri.scheme) && uri.host.present? && uri.userinfo.nil?
      end

      def valid_field?(field)
        return false unless field.is_a?(Hash) && (field.keys - %w[id label type required sensitive choices]).empty?
        return false unless boolean?(field["required"]) && boolean?(field["sensitive"]) && valid_label?(field["label"])

        id, type = field.values_at("id", "type")
        builtin = FIELD_TYPES[id]
        return false unless builtin ? type == builtin : id.is_a?(String) && id.match?(/\Acustom_[a-z][a-z0-9_]{0,49}\z/) && CUSTOM_TYPES.include?(type)
        return false if type == "compensation" && !field["sensitive"]
        return false if id == "employment_status" && field["choices"] != EMPLOYMENT_STATUSES
        return !field.key?("choices") unless type == "select"

        choices = field["choices"]
        choices.is_a?(Array) && choices.size.between?(1, 30) && choices.all? { |choice| valid_label?(choice) } && choices.uniq == choices
      end

      def valid_label?(value)
        value.is_a?(String) && value.valid_encoding? && value.present? && value.length <= 120 && !value.match?(/[[:cntrl:]]/)
      end

      def boolean?(value) = value == true || value == false
  end
end
