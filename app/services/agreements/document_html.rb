# frozen_string_literal: true

module Agreements
  class DocumentHtml
    TAGS = { "paragraph" => "p", "bulletList" => "ul", "orderedList" => "ol", "listItem" => "li",
      "table" => "table", "tableRow" => "tr", "tableCell" => "td", "tableHeader" => "th" }.freeze
    MARK_TAGS = { "bold" => "strong", "italic" => "em", "underline" => "u", "strike" => "s" }.freeze

    def initialize(document, fields:, values:)
      @document, @fields, @values = document, fields, values
    end

    def process
      errors = Document.new(@document, fields: @fields, values: @values).errors
      raise ArgumentError, errors.join(". ") if errors.any?

      @fields_by_key = @fields.index_by { |field| field["key"] }
      render_node(@document)
    end

    private

      def render_node(node)
        type = node["type"]
        attributes = node.fetch("attrs", {})
        case type
        when "text"
          formatted(node, escape(node["text"]))
        when "mergeField" then formatted(node, render_field(attributes["key"]))
        when "hardBreak" then "<br>"
        when "horizontalRule" then "<hr>"
        when "pageBreak" then '<div class="page-break"></div>'
        else
          children = node.fetch("content", []).map { |child| render_node(child) }.join
          return children if type == "doc"

          tag = type == "heading" ? "h#{attributes.fetch('level')}" : TAGS.fetch(type)
          "<#{tag}#{html_attributes(type, attributes)}>#{children}</#{tag}>"
        end
      end

      def formatted(node, content)
        node.fetch("marks", []).reduce(content) do |text, mark|
          tag = MARK_TAGS.fetch(mark["type"])
          "<#{tag}>#{text}</#{tag}>"
        end
      end

      def render_field(key)
        field = @fields_by_key.fetch(key)
        value = @values[key]
        return escape("[#{field['label']} — incomplete]") if value.nil? || (value.is_a?(String) && value.blank?)
        return value ? "☑" : "☐" if field["type"] == "checkbox"

        escape(value)
      end

      def html_attributes(type, attributes)
        result = ""
        result += " style=\"text-align:#{attributes['textAlign']}\"" if attributes["textAlign"]
        result += " start=\"#{attributes['start']}\"" if type == "orderedList" && attributes["start"]
        if %w[tableCell tableHeader].include?(type)
          result += " colspan=\"#{attributes.fetch('colspan', 1)}\" rowspan=\"#{attributes.fetch('rowspan', 1)}\""
          result += " style=\"width:#{attributes['colwidth'].sum}px\"" if attributes["colwidth"]
        end
        result
      end

      def escape(value)
        ERB::Util.html_escape(value.to_s)
      end
  end
end
