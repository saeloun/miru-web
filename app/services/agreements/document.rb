# frozen_string_literal: true

module Agreements
  class Document
    MAX_BYTES = 512.kilobytes
    MAX_NODES = 20_000
    MAX_DEPTH = 20
    FIELD_TYPES = %w[text date number checkbox dropdown signature initials].freeze
    ROLES = %w[admin counterparty company_signer].freeze
    MARKS = %w[bold italic underline strike].freeze
    BLOCKS = %w[paragraph heading bulletList orderedList table horizontalRule pageBreak].freeze
    INLINE = %w[text hardBreak mergeField].freeze
    CHILDREN = {
      "doc" => BLOCKS, "paragraph" => INLINE, "heading" => INLINE,
      "bulletList" => %w[listItem], "orderedList" => %w[listItem], "listItem" => BLOCKS,
      "table" => %w[tableRow], "tableRow" => %w[tableCell tableHeader],
      "tableCell" => BLOCKS, "tableHeader" => BLOCKS
    }.freeze
    ATTRIBUTES = {
      "paragraph" => %w[textAlign], "heading" => %w[level textAlign], "orderedList" => %w[start],
      "tableCell" => %w[colspan rowspan colwidth], "tableHeader" => %w[colspan rowspan colwidth],
      "mergeField" => %w[key]
    }.freeze

    attr_reader :fields, :values

    def initialize(document, fields:, values: {})
      @document, @fields, @values = document, fields, values
    end

    def errors
      @errors ||= begin
        @problems = []
        @nodes = 0
        validate_fields
        if @document.is_a?(Hash) && @document["type"] == "doc" && @document.to_json.bytesize <= MAX_BYTES
          validate_node(@document, 0)
        else
          @problems << "Document must be a structured contract of at most 512 KiB"
        end
        validate_values
        @problems.uniq
      rescue JSON::NestingError
        ["Document nesting is too deep"]
      end
    end

    def missing_required_keys
      return [] if errors.any?

      fields.filter_map do |field|
        value = values[field["key"]]
        field["key"] if field["required"] && (value.nil? || (value.is_a?(String) && value.blank?))
      end
    end

    private

      def validate_fields
        @field_keys = []
        unless fields.is_a?(Array) && fields.length <= 100 && fields.to_json.bytesize <= 64.kilobytes
          @problems << "Fields must be an array of at most 100 definitions and 64 KiB"
          return
        end
        fields.each do |field|
          unless valid_field?(field)
            @problems << "Field definitions must have a unique safe key, label, type, role and boolean flags"
            next
          end
          @field_keys << field["key"]
        end
      end

      def valid_field?(field)
        return false unless field.is_a?(Hash) &&
          (field.keys - %w[key label type role required read_only options]).empty?

        key = field["key"]
        key.is_a?(String) && key.match?(/\A[a-z][a-z0-9_]{0,63}\z/) &&
          !%w[constructor prototype].include?(key) && !@field_keys.include?(key) &&
          field["label"].is_a?(String) && field["label"].present? && field["label"].length <= 120 &&
          FIELD_TYPES.include?(field["type"]) && ROLES.include?(field["role"]) &&
          [true, false].include?(field["required"]) && [true, false].include?(field["read_only"]) &&
          valid_options?(field)
      end

      def valid_options?(field)
        options = field.fetch("options", [])
        return options == [] unless field["type"] == "dropdown"

        options.is_a?(Array) && options.length.between?(1, 30) && options.uniq == options &&
          options.all? { |value| value.is_a?(String) && value.present? && value.length <= 200 }
      end

      def validate_node(node, depth)
        @nodes += 1
        if depth > MAX_DEPTH || @nodes > MAX_NODES
          @problems << "Document exceeds the nesting or node limit"
          return
        end
        unless node.is_a?(Hash) && (node.keys - %w[type attrs content text marks]).empty?
          @problems << "Document contains an invalid node"
          return
        end
        type = node["type"]
        unless CHILDREN.key?(type) || (INLINE + %w[horizontalRule pageBreak]).include?(type)
          @problems << "Document contains an unsupported node"
          return
        end
        validate_attributes(type, node.fetch("attrs", {}))
        validate_text_and_marks(type, node)
        children = node.fetch("content", [])
        unless children.is_a?(Array) && children.all? { |child| child.is_a?(Hash) && CHILDREN.fetch(type, []).include?(child["type"]) }
          @problems << "Document contains invalid child nodes"
          return
        end
        if children.empty? && (CHILDREN.keys - %w[paragraph heading]).include?(type)
          @problems << "Document blocks cannot be empty"
        end
        if type == "listItem" && children.first&.dig("type") != "paragraph"
          @problems << "List items must begin with a paragraph"
        end
        children.each do |child|
          break if @nodes > MAX_NODES

          validate_node(child, depth + 1)
        end
      end

      def validate_text_and_marks(type, node)
        if type == "text"
          @problems << "Text nodes require nonempty text" unless node["text"].is_a?(String) && !node["text"].empty?
        elsif node.key?("text")
          @problems << "Only text nodes can contain text"
        end
        marks = node.fetch("marks", [])
        unless marks.is_a?(Array) && marks.all? { |mark| mark.is_a?(Hash) && mark.keys == ["type"] && MARKS.include?(mark["type"]) } &&
            marks.uniq == marks && (marks.empty? || type == "text")
          @problems << "Document contains unsupported formatting"
        end
      end

      def validate_attributes(type, attributes)
        unless attributes.is_a?(Hash) && (attributes.keys - ATTRIBUTES.fetch(type, [])).empty?
          @problems << "Document contains unsupported attributes"
          return
        end
        if attributes.key?("textAlign") && !%w[left center right justify].include?(attributes["textAlign"])
          @problems << "Text alignment is invalid"
        end
        case type
        when "heading"
          @problems << "Heading level is invalid" unless (1..3).include?(attributes["level"])
        when "orderedList"
          @problems << "List start is invalid" unless positive_integer?(attributes.fetch("start", 1), 1_000_000)
        when "mergeField"
          @problems << "Document references an unknown field" unless @field_keys.include?(attributes["key"])
        when "tableCell", "tableHeader"
          %w[colspan rowspan].each do |key|
            @problems << "Table span is invalid" unless positive_integer?(attributes.fetch(key, 1), 20)
          end
          widths = attributes["colwidth"]
          unless widths.nil? || (widths.is_a?(Array) && widths.length == attributes.fetch("colspan", 1) &&
              widths.all? { |width| positive_integer?(width, 2000) })
            @problems << "Table column widths are invalid"
          end
        end
      end

      def positive_integer?(value, maximum)
        value.is_a?(Integer) && value.between?(1, maximum)
      end

      def validate_values
        unless values.is_a?(Hash) && (values.keys - @field_keys).empty? && values.to_json.bytesize <= MAX_BYTES
          @problems << "Values must belong to declared fields and fit within 512 KiB"
          return
        end
        return unless fields.is_a?(Array)

        fields.each do |field|
          next unless field.is_a?(Hash) && @field_keys.include?(field["key"])

          value = values[field["key"]]
          next if value.nil? || value == ""

          @problems << "Invalid value for #{field['key']}" unless valid_value?(field, value)
        end
      end

      def valid_value?(field, value)
        case field["type"]
        when "text" then value.is_a?(String) && value.length <= 5000
        when "date" then EmployeeRecord.iso_date?(value)
        when "number" then value.is_a?(String) && value.match?(/\A-?\d{1,12}(?:\.\d{1,4})?\z/)
        when "checkbox" then [true, false].include?(value)
        when "dropdown" then field["options"].include?(value)
        else false # Signature values are supplied only by a future verified signing workflow.
        end
      end
  end
end
