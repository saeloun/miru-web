# frozen_string_literal: true

require "zip"

module Agreements
  class DocxImport
    class Error < StandardError; end

    MIME_TYPE = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    WORD_NAMESPACES = %w[http://schemas.openxmlformats.org/wordprocessingml/2006/main
      http://purl.oclc.org/ooxml/wordprocessingml/main].freeze
    MAX_UPLOAD = 5.megabytes
    MAX_PART = 2.megabytes
    MAX_EXPANDED = 10.megabytes
    NORMALIZED_LAYOUT = "Review the preview: Word fonts, colors, spacing, page sizes and table widths use Miru's layout."
    RUN_METADATA = %w[rStyle rFonts sz szCs color lang highlight kern spacing noProof rtl cs].freeze
    PARAGRAPH_METADATA = %w[pStyle spacing ind keepNext keepLines widowControl tabs contextualSpacing
      suppressAutoHyphens adjustRightInd snapToGrid rPr sectPr].freeze

    def initialize(upload, fields: [])
      @upload, @fields = upload, fields.deep_dup
      @styles = {}
      @resolved_styles = {}
      @numbering = {}
      @list_counters = {}
      @default_properties = { paragraph: {}, marks: {} }
    end

    def process
      validate_upload!
      validate_result!({ "type" => "doc", "content" => [{ "type" => "paragraph" }] })
      Zip::File.open_buffer(@archive_data) do |zip|
        validate_archive!(zip)
        validate_note_parts!(zip)
        content_types = xml_part(zip, "[Content_Types].xml")
        unless content_types.xpath("//*[local-name()='Override']").any? do |node|
            node["PartName"] == "/word/document.xml" && node["ContentType"] == "#{MIME_TYPE}.main+xml"
          end
          raise Error, "Choose a Word DOCX document, without macros"
        end
        zip.entries.select { |entry| entry.name.end_with?(".rels") }.each do |entry|
          if xml_part(zip, entry.name).xpath("//*[local-name()='Relationship'][@TargetMode='External']").any?
            raise Error, "External relationships are unsupported; include the required terms directly in the document"
          end
        end
        relationships = xml_part(zip, "_rels/.rels").xpath("//*[local-name()='Relationship']").select do |node|
          ["http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument",
           "http://purl.oclc.org/ooxml/officeDocument/relationships/officeDocument"].include?(node["Type"])
        end
        unless relationships.size == 1 && relationships.first["Target"]&.delete_prefix("/") == "word/document.xml"
          raise Error, "Unsupported main document relationship"
        end
        load_styles(zip) if zip.find_entry("word/styles.xml")
        load_numbering(zip) if zip.find_entry("word/numbering.xml")
        source = xml_part(zip, "word/document.xml")
        root = source.root
        unless root&.name == "document" && WORD_NAMESPACES.include?(root.namespace&.href)
          raise Error, "The upload does not contain a supported Word document"
        end
        body = word_children(root).sole
        raise Error, "The Word document body is invalid" unless body.name == "body"

        document = { "type" => "doc", "content" => parse_blocks(body, 0) }
        document["content"] = [{ "type" => "paragraph" }] if document["content"].empty?
        validate_result!(document)
        return { document:, fields: @fields, warnings: [NORMALIZED_LAYOUT] }
      end
    rescue Zip::Error, Nokogiri::XML::SyntaxError, Enumerable::SoleItemExpectedError
      raise Error, "The DOCX archive or XML is invalid; the existing agreement has not changed"
    end

    private

      def validate_upload!
        unless @upload.is_a?(ActionDispatch::Http::UploadedFile) &&
            File.extname(@upload.original_filename).downcase == ".docx" &&
            [MIME_TYPE, "application/octet-stream"].include?(@upload.content_type)
          raise Error, "Choose an uploaded DOCX file"
        end
        raise Error, "DOCX files must be 5 MiB or smaller" if @upload.size > MAX_UPLOAD

        @archive_data = File.binread(@upload.tempfile.path, MAX_UPLOAD + 1)
        raise Error, "DOCX files must be 5 MiB or smaller" if @archive_data.bytesize > MAX_UPLOAD

        ending = @archive_data.rindex("PK\x05\x06".b)
        record = ending && @archive_data.byteslice(ending, 22)
        raise Error, "The DOCX archive directory is invalid" unless record&.bytesize == 22

        _signature, disk, directory_disk, disk_entries, entries, directory_size, directory_offset, comment_size = record.unpack("a4v4V2v")
        unless disk.zero? && directory_disk.zero? && disk_entries == entries && entries <= 200 &&
            directory_size + directory_offset == ending && ending + 22 + comment_size == @archive_data.bytesize
          raise Error, "The DOCX archive directory is invalid or exceeds the entry limit"
        end
        @declared_entries = entries
      end

      def validate_archive!(zip)
        entries = zip.entries
        if entries.length > 200 || entries.sum(&:size) > MAX_EXPANDED || entries.any? { |entry| entry.size > MAX_PART }
          raise Error, "The expanded DOCX exceeds the import size limit"
        end
        if entries.length != @declared_entries || entries.map(&:name).uniq.length != entries.length || entries.any? do |entry|
            entry.encrypted? || entry.name.start_with?("/", "\\") || entry.name.split(/[\\\/]/).include?("..")
          end
          raise Error, "The DOCX archive contains unsafe or duplicate entries"
        end
        if entries.any? { |entry| entry.name.match?(%r{\Aword/(?:header|footer|comments|glossary|media|embeddings|activeX|vbaProject)}i) }
          raise Error, "Unsupported Word content: headers, footers, notes, comments, images or embedded objects. Include legal text in the body before importing."
        end
      end

      def validate_note_parts!(zip)
        %w[footnotes endnotes].each do |name|
          next unless zip.find_entry("word/#{name}.xml")

          source = xml_part(zip, "word/#{name}.xml")
          root = source.root
          unless root&.name == name && WORD_NAMESPACES.include?(root.namespace&.href)
            raise Error, "Unsupported Word notes"
          end
          word_children(root).each do |note|
            dynamic = note.xpath(".//*[local-name()='fldSimple' or local-name()='drawing' or local-name()='object' or local-name()='sym']")
            unless %w[separator continuationSeparator].include?(word_value(note, "type")) && note.text.blank? && dynamic.empty?
              raise Error, "Unsupported Word notes contain content; include legal text in the body before importing"
            end
          end
        end
      end

      def xml_part(zip, name)
        entry = zip.find_entry(name)
        raise Error, "A required DOCX part is missing" unless entry

        data = entry.get_input_stream { |stream| stream.read(MAX_PART + 1) }
        raise Error, "A DOCX part exceeds the import size limit" if data.bytesize > MAX_PART

        document = Nokogiri::XML(data) { |config| config.strict.nonet }
        if document.internal_subset || document.children.any?(&:processing_instruction?)
          raise Error, "XML entities, DTDs and processing instructions are unsupported"
        end
        document
      end

      def word_children(node)
        if node.children.any? { |child| child.text? && child.text.present? }
          raise Error, "Unsupported text outside a Word text run"
        end
        node.element_children.each do |child|
          raise Error, "Unsupported XML namespace" unless WORD_NAMESPACES.include?(child.namespace&.href)
        end
        node.element_children
      end

      def word_value(node, attribute = "val")
        node&.attribute_with_ns(attribute, node.namespace&.href)&.value
      end

      def integer_value(node, attribute: "val", minimum: 0, maximum: 100_000)
        value = word_value(node, attribute)
        unless value&.match?(/\A\d{1,6}\z/) && value.to_i.between?(minimum, maximum)
          raise Error, "Unsupported numeric Word property"
        end
        value.to_i
      end

      def load_styles(zip)
        source = xml_part(zip, "word/styles.xml")
        source.xpath("//*[local-name()='style']").each do |style|
          id = word_value(style, "styleId")
          raise Error, "Duplicate Word style" if @styles.key?(id)

          @styles[id] = style
        end
        defaults = source.at_xpath("//*[local-name()='docDefaults']")
        if defaults
          @default_properties = {
            paragraph: paragraph_properties(defaults.at_xpath("./*[local-name()='pPrDefault']/*[local-name()='pPr']")),
            marks: run_properties(defaults.at_xpath("./*[local-name()='rPrDefault']/*[local-name()='rPr']"))
          }
        end
      end

      def style_properties(id, ancestors = [])
        return { paragraph: {}, marks: {} } if id.nil? || (id == "Normal" && !@styles.key?(id))
        return @resolved_styles[id] if @resolved_styles.key?(id)
        raise Error, "Unsupported cyclic Word style" if ancestors.include?(id) || ancestors.length > 20

        style = @styles[id]
        unless style
          return { paragraph: { "level" => id[-1].to_i }, marks: {} } if id.match?(/\AHeading[1-3]\z/i)

          raise Error, "Unsupported missing Word style: #{id.to_s.first(80)}"
        end
        children = word_children(style)
        inherited = style_properties(word_value(children.find { |child| child.name == "basedOn" }), ancestors + [id])
        paragraph = paragraph_properties(children.find { |child| child.name == "pPr" })
        paragraph["level"] = id[-1].to_i if id.match?(/\AHeading[1-3]\z/i) && !paragraph.key?("level")
        marks = run_properties(children.find { |child| child.name == "rPr" }, ancestors + [id])
        @resolved_styles[id] = { paragraph: inherited[:paragraph].merge(paragraph), marks: inherited[:marks].merge(marks) }
      end

      def paragraph_properties(node)
        return {} unless node

        word_children(node).each_with_object({}) do |child, result|
          case child.name
          when "jc"
            alignment = word_value(child)
            result["textAlign"] = alignment == "both" ? "justify" : alignment
          when "outlineLvl"
            level = integer_value(child, maximum: 9)
            result["level"] = level == 9 ? nil : level + 1
          when "numPr"
            properties = word_children(child)
            result["num_id"] = word_value(properties.find { |property| property.name == "numId" })
            level = properties.find { |property| property.name == "ilvl" }
            result["list_level"] = level ? integer_value(level, maximum: 8) : 0
          when "pageBreakBefore"
            result["page_break"] = !%w[0 false off].include?(word_value(child))
          else
            unsupported!(child) unless PARAGRAPH_METADATA.include?(child.name)
          end
        end
      end

      def run_properties(node, ancestors = [])
        return {} unless node

        result = {}
        children = word_children(node)
        if (style = children.find { |child| child.name == "rStyle" })
          result.merge!(style_properties(word_value(style), ancestors)[:marks])
        end
        children.each do |child|
          mark = { "b" => "bold", "bCs" => "bold", "i" => "italic", "iCs" => "italic", "u" => "underline", "strike" => "strike" }[child.name]
          if mark
            result[mark] = !%w[0 false off none].include?(word_value(child))
          else
            unsupported!(child) unless RUN_METADATA.include?(child.name)
          end
        end
        result
      end

      def load_numbering(zip)
        source = xml_part(zip, "word/numbering.xml")
        definitions = source.xpath("//*[local-name()='abstractNum']")
        @abstract_numbering = definitions.index_by { |node| word_value(node, "abstractNumId") }
        raise Error, "Duplicate Word numbering definition" unless @abstract_numbering.size == definitions.size

        source.xpath("//*[local-name()='num']").each do |number|
          id = word_value(number, "numId")
          raise Error, "Duplicate Word numbering reference" if @numbering.key?(id)

          @numbering[id] = number
        end
      end

      def numbering_format(id, index)
        number = @numbering[id]
        return unless number

        references = word_children(number)
        abstract = @abstract_numbering[word_value(references.find { |node| node.name == "abstractNumId" })]
        return unless abstract

        override = references.find { |node| node.name == "lvlOverride" && word_value(node, "ilvl") == index.to_s }
        overrides = override ? word_children(override) : []
        raise Error, "Unsupported Word numbering override" if overrides.any? { |node| !%w[lvl startOverride].include?(node.name) }

        level = overrides.find { |node| node.name == "lvl" } ||
          word_children(abstract).find { |node| node.name == "lvl" && word_value(node, "ilvl") == index.to_s }
        return unless level

        properties = word_children(level)
        format = word_value(properties.find { |node| node.name == "numFmt" })
        label = word_value(properties.find { |node| node.name == "lvlText" })
        bullets = ["•", "·", "●", "○", "▪", "o", "-", "\uF0B7", "\uF0A7"]
        unless (format == "decimal" && label == "%#{index + 1}.") || (format == "bullet" && bullets.include?(label))
          raise Error, "Unsupported Word list numbering; preserve clause numbers as text before importing"
        end
        start = overrides.find { |node| node.name == "startOverride" } || properties.find { |node| node.name == "start" }
        { type: format == "bullet" ? "bulletList" : "orderedList", start: start ? integer_value(start, minimum: 1) : 1 }
      end

      def parse_blocks(parent, depth)
        raise Error, "DOCX nesting exceeds the import limit" if depth > 20

        blocks = []
        lists = []
        word_children(parent).each do |node|
          case node.name
          when "p"
            properties, paragraphs = parse_paragraph(node)
            if properties["num_id"].present? && properties["num_id"] != "0"
              append_list(blocks, lists, properties, paragraphs)
            else
              lists.clear
              blocks.concat(paragraphs)
            end
          when "tbl"
            lists.clear
            blocks << parse_table(node, depth + 1)
          when "sectPr"
            unsupported!(node) if word_children(node).any? { |child| %w[headerReference footerReference].include?(child.name) }
          else unsupported!(node)
          end
        end
        blocks
      end

      def parse_paragraph(node)
        children = word_children(node)
        ppr = children.find { |child| child.name == "pPr" }
        style_id = word_value(ppr && word_children(ppr).find { |child| child.name == "pStyle" }) || "Normal"
        style = style_properties(style_id)
        properties = @default_properties[:paragraph].merge(style[:paragraph]).merge(paragraph_properties(ppr))
        inlines = []
        children.each do |child|
          next if %w[pPr bookmarkStart bookmarkEnd proofErr].include?(child.name)
          unsupported!(child) unless child.name == "r"

          run_children = word_children(child)
          marks = @default_properties[:marks].merge(style[:marks]).merge(run_properties(run_children.find { |item| item.name == "rPr" }))
            .filter_map { |type, enabled| { "type" => type } if enabled }
          run_children.each do |item|
            case item.name
            when "rPr", "lastRenderedPageBreak" then next
            when "t"
              unsupported!(item) if item.element_children.any?
              inlines << { "type" => "text", "text" => item.text, "marks" => marks } unless item.text.empty?
            when "tab" then inlines << { "type" => "text", "text" => "\t", "marks" => marks }
            when "br", "cr"
              type = word_value(item, "type")
              raise Error, "Unsupported Word column break" unless [nil, "textWrapping", "page"].include?(type)

              inlines << { "type" => type == "page" ? "pageBreak" : "hardBreak" }
            else unsupported!(item)
            end
          end
        end
        type = properties["level"] ? "heading" : "paragraph"
        attributes = properties.slice("level", "textAlign").compact
        paragraphs = []
        paragraphs << { "type" => "pageBreak" } if properties["page_break"]
        segments = [[]]
        inlines.each { |inline| inline["type"] == "pageBreak" ? segments << [] : segments.last << inline }
        segments.each_with_index do |segment, index|
          paragraphs << { "type" => "pageBreak" } if index.positive?
          paragraphs << { "type" => type, "attrs" => attributes, "content" => merge_placeholders(segment) } unless segment.empty? && segments.length > 1
        end
        [properties, paragraphs]
      end

      def merge_placeholders(inlines)
        result = []
        inlines.chunk { |node| node["type"] == "text" }.each do |text_group, nodes|
          unless text_group
            result.concat(nodes)
            next
          end
          text = nodes.map { |node| node["text"] }.join
          offsets = []
          position = 0
          nodes.each { |node| offsets << [position, position += node["text"].length, node] }
          cursor = 0
          text.to_enum(:scan, /\{\{([^{}]+)\}\}/).each do
            match = Regexp.last_match
            result.concat(text_slice(offsets, cursor, match.begin(0)))
            key = match[1]
            unless key.match?(/\A[a-z][a-z0-9_]{0,63}\z/) && !%w[constructor prototype].include?(key)
              raise Error, "Unsupported placeholder key"
            end
            unless @fields.any? { |field| field["key"] == key }
              raise Error, "A template can contain at most 100 fields" if @fields.length >= 100

              @fields << { "key" => key, "label" => key.humanize, "type" => "text", "role" => "admin",
                "required" => true, "read_only" => false }
            end
            marks = offsets.bsearch { |_start, finish, _node| finish > match.begin(0) }.last["marks"]
            result << { "type" => "mergeField", "attrs" => { "key" => key }, "marks" => marks }
            cursor = match.end(0)
          end
          result.concat(text_slice(offsets, cursor, text.length))
        end
        result
      end

      def text_slice(offsets, from, to)
        index = offsets.bsearch_index { |_start, finish, _node| finish > from }
        result = []
        while index && index < offsets.length && offsets[index][0] < to
          start, finish, node = offsets[index]
          result << node.merge("text" => node["text"][[from - start, 0].max...([finish, to].min - start)])
          index += 1
        end
        result
      end

      def append_list(blocks, lists, properties, paragraphs)
        id, level = properties.values_at("num_id", "list_level")
        format = numbering_format(id, level)
        raise Error, "Unsupported Word list or heading numbering" unless format && paragraphs.all? { |node| node["type"] == "paragraph" }

        lists.clear if lists.first && lists.first[:id] != id
        lists.pop while lists.length > level + 1
        if lists.length <= level
          raise Error, "Unsupported skipped Word list level" unless lists.length == level

          list = { "type" => format[:type], "content" => [] }
          list["attrs"] = { "start" => @list_counters.fetch([id, level], format[:start]) } if format[:type] == "orderedList"
          destination = level.zero? ? blocks : lists.last[:node]["content"].last["content"]
          destination << list
          lists << { id:, node: list }
        end
        lists.last[:node]["content"] << { "type" => "listItem", "content" => paragraphs }
        @list_counters[[id, level]] = @list_counters.fetch([id, level], format[:start]) + 1
        @list_counters.delete_if { |(number_id, number_level), _value| number_id == id && number_level > level }
      end

      def parse_table(node, depth)
        rows = word_children(node).filter_map do |row|
          next if %w[tblPr tblGrid].include?(row.name)
          unsupported!(row) unless row.name == "tr"

          cells = word_children(row).filter_map do |cell|
            next if cell.name == "trPr"
            unsupported!(cell) unless cell.name == "tc"

            properties = word_children(cell).find { |child| child.name == "tcPr" }
            span = 1
            word_children(properties).each do |property|
              if property.name == "gridSpan"
                span = integer_value(property, minimum: 1, maximum: 20)
              elsif !%w[tcW tcBorders shd vAlign tcMar].include?(property.name)
                unsupported!(property)
              end
            end if properties
            content_parent = cell.dup
            content_parent.element_children.select { |child| child.name == "tcPr" }.each(&:remove)
            content = parse_blocks(content_parent, depth)
            { "type" => "tableCell", "attrs" => { "colspan" => span, "rowspan" => 1 },
              "content" => content.presence || [{ "type" => "paragraph" }] }
          end
          { "type" => "tableRow", "content" => cells }
        end
        { "type" => "table", "content" => rows }
      end

      def unsupported!(node)
        raise Error, "Unsupported Word element: #{node.name}. The existing agreement has not changed."
      end

      def validate_result!(document)
        errors = Document.new(document, fields: @fields).errors
        raise Error, errors.join(". ") if errors.any?
      end
  end
end
