# frozen_string_literal: true

require "date"
require "json"
require "uri"

module Signatures
  class Configuration
    MAX_BYTES = 128 * 1024
    MAX_FIELDS = 100
    MAX_RECIPIENTS = 20
    TYPES = %w[signature initials date name email text number checkbox dropdown].freeze
    FIELD_KEYS = %w[id document_id recipient_id page type label required read_only x y width height options value].freeze
    RECIPIENT_KEYS = %w[id name email role].freeze
    ID = /\A[a-zA-Z0-9_-]{1,64}\z/

    def initialize(documents:, recipients:, fields:)
      @documents, @recipients, @fields = documents, recipients, fields
    end

    def errors
      @errors ||= validate
    end

    def ready_errors
      return errors.dup if errors.any?

      result = []
      signers = @recipients.select { |recipient| recipient["role"] == "signer" }
      result << "Add at least one signer before approval" if signers.empty?
      unless signers.all? { |signer| @fields.any? { |field| field["recipient_id"] == signer["id"] && field["type"] == "signature" && field["required"] } }
        result << "Each signer needs a required signature field"
      end
      if @fields.any? { |field| field["required"] && field["read_only"] && field["value"].blank? }
        result << "Required read-only fields need a value before approval"
      end
      result
    end

    private

      def validate
        payload = JSON.generate([@documents, @recipients, @fields], max_nesting: 20)
        return ["Signing configuration exceeds its size limit"] if payload.bytesize > MAX_BYTES
        unless @documents.is_a?(Array) && @documents.size.between?(1, 10) &&
            @recipients.is_a?(Array) && @recipients.size <= MAX_RECIPIENTS &&
            @fields.is_a?(Array) && @fields.size <= MAX_FIELDS
          return ["Use at most 10 documents, 20 recipients and 100 fields"]
        end
        result = []
        result << "Documents need unique identities and valid PDF pages" unless valid_documents?
        result << "Recipients need unique identities, names, valid email addresses and roles" unless valid_recipients?
        unless @fields.all? { |field| valid_field?(field) } && unique?(@fields, "id")
          result << "Fields need unique identities, assigned signers, supported values and positions within an existing page"
        end
        result
      rescue JSON::GeneratorError, JSON::NestingError
        ["Invalid signing configuration"]
      end

      def valid_documents?
        unique?(@documents, "key") && @documents.all? do |document|
          document.is_a?(Hash) && valid_id?(document["key"]) && document["pages"].is_a?(Array) &&
            document["pages"].size.between?(1, PdfInfo::MAX_PAGES) && document["pages"].all? do |page|
            page.is_a?(Hash) && number?(page["width"]) && page["width"].positive? &&
              number?(page["height"]) && page["height"].positive? &&
              PdfInfo.valid_dimensions?(page["width"], page["height"]) &&
              page["rotation"].is_a?(Integer) && [0, 90, 180, 270].include?(page["rotation"])
          end
        end && @documents.sum { |document| document["pages"].size } <= PdfInfo::MAX_PAGES
      end

      def valid_recipients?
        unique?(@recipients, "id") && @recipients.all? do |person|
          person.is_a?(Hash) && (person.keys - RECIPIENT_KEYS).empty? && valid_id?(person["id"]) &&
            label?(person["name"]) && email?(person["email"]) && %w[signer reviewer cc].include?(person["role"])
        end && @recipients.map { |person| person["email"].downcase }.uniq.size == @recipients.size
      end

      def valid_field?(field)
        return false unless field.is_a?(Hash) && (field.keys - FIELD_KEYS).empty? && valid_id?(field["id"]) &&
          label?(field["label"]) && TYPES.include?(field["type"]) &&
          [true, false].include?(field["required"]) && [true, false].include?(field["read_only"])

        document = @documents.find { |item| item.is_a?(Hash) && item["key"] == field["document_id"] }
        person = @recipients.find { |item| item.is_a?(Hash) && item["id"] == field["recipient_id"] }
        return false unless document && document["pages"].is_a?(Array) && person && person["role"] == "signer" &&
          field["page"].is_a?(Integer) && field["page"].between?(1, document["pages"].size)
        return false unless %w[x y width height].all? { |key| number?(field[key]) } &&
          field["x"] >= 0 && field["y"] >= 0 && field["width"].positive? && field["height"].positive? &&
          field["x"] + field["width"] <= 100 && field["y"] + field["height"] <= 100

        valid_value?(field)
      end

      def valid_value?(field)
        type, value = field.values_at("type", "value")
        return !field.key?("value") && !field["read_only"] && !field.key?("options") if %w[signature initials].include?(type)
        return false if type != "dropdown" && field.key?("options")
        if type == "dropdown"
          options = field["options"]
          return options.is_a?(Array) && options.size.between?(1, 50) && options.all? { |option| label?(option) } &&
            options.uniq.size == options.size && (value.nil? || options.include?(value))
        end
        return true if value.nil?

        case type
        when "checkbox" then [true, false].include?(value)
        when "number" then value.is_a?(String) && value.length <= 100 && (value.empty? || value.match?(/\A-?\d+(?:\.\d+)?\z/))
        when "date" then value.is_a?(String) && (value.empty? || (value.match?(/\A\d{4}-\d{2}-\d{2}\z/) && Date.iso8601(value).iso8601 == value))
        when "email" then value == "" || email?(value)
        else value.is_a?(String) && value.length <= 2000 && !value.match?(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/)
        end
      rescue Date::Error
        false
      end

      def unique?(items, key)
        items.all? { |item| item.is_a?(Hash) } && items.pluck(key).uniq.size == items.size
      end

      def valid_id?(value)
        value.is_a?(String) && value.match?(ID)
      end

      def label?(value)
        value.is_a?(String) && value.strip.present? && value.length <= 200 && !value.match?(/[\x00-\x1F\x7F]/)
      end

      def email?(value)
        value.is_a?(String) && value == value.strip && value.length <= 254 && value.match?(URI::MailTo::EMAIL_REGEXP) &&
          !value.match?(/[\x00-\x20\x7F]/)
      end

      def number?(value)
        value.is_a?(Integer) || (value.is_a?(Float) && value.finite?)
      end
  end
end
