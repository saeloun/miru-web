# frozen_string_literal: true

require "digest"
require "json"
require "open3"
require "timeout"

module Signatures
  class PdfInfo
    class InvalidDocument < StandardError; end
    class Unavailable < StandardError; end

    MAX_BYTES = 5 * 1024 * 1024
    MAX_PAGES = 100
    MAX_IMAGE_PIXELS = 16_000_000
    MAX_PAGE_AREA = 16_000_000
    MAX_PAGE_SIDE = 14_400
    MAX_OUTPUT_BYTES = 65_536
    MAX_STRUCTURE_BYTES = 1024 * 1024
    TIMEOUT_SECONDS = 5
    ACTIVE_ACTIONS = %w[/JavaScript /Launch /SubmitForm /ImportData /GoToR /GoToE /Rendition /Movie /Sound].freeze
    INVALID_MESSAGE = "Upload a flat, unlocked PDF of at most 5 MiB and 100 pages."
    GEOMETRY_MESSAGE = "PDF page sizes exceed the supported rendering limits. Export oversized or unusually scaled pages as standard-size PDF pages and retry."

    def self.valid_dimensions?(width, height)
      [width, height].all? { |value| (value.is_a?(Integer) || value.is_a?(Float)) && value.finite? && value.between?(1, MAX_PAGE_SIDE) } &&
        width * height <= MAX_PAGE_AREA
    end

    def initialize(path)
      @path = File.path(path)
    end

    def process
      invalid! unless File.file?(@path) && File.size(@path).between?(1, self.class::MAX_BYTES)
      invalid! unless File.binread(@path, 5) == "%PDF-"
      pages = parse(capture("pdfinfo", "-box", "-f", "1", "-l", self.class::MAX_PAGES.to_s, @path))
      structure = reject_active_content(capture("qpdf", "--json", "--json-key=qpdf", "--json-key=pages", "--json-stream-data=none", @path,
        output_limit: MAX_STRUCTURE_BYTES))
      check_structure(structure, pages.size)
      check_images(capture("pdfimages", "-list", @path))
      { "sha256" => Digest::SHA256.file(@path).hexdigest, "pages" => pages }
    rescue Timeout::Error, IOError, Errno::EACCES, Errno::ENOENT, Errno::EISDIR, JSON::ParserError, JSON::NestingError
      invalid!
    end

    private

      def capture(*command, output_limit: MAX_OUTPUT_BYTES)
        limits = { pgroup: true, unsetenv_others: true, rlimit_cpu: [TIMEOUT_SECONDS, TIMEOUT_SECONDS] }
        limits[:rlimit_as] = [256 * 1024 * 1024, 256 * 1024 * 1024] if RUBY_PLATFORM.include?("linux")
        environment = { "LC_ALL" => "C", "PATH" => ENV.fetch("PATH", "/usr/local/bin:/usr/bin:/bin") }
        Open3.popen2e(environment, *command, **limits) do |input, output, wait|
          input.close
          begin
            Timeout.timeout(TIMEOUT_SECONDS) do
              result = +"".b
              begin
                loop do
                  result << output.readpartial(4096)
                  invalid! if result.bytesize > output_limit
                end
              rescue EOFError
                invalid! unless wait.value.success?
              end
              result
            end
          ensure
            begin
              Process.kill("KILL", -wait.pid) unless wait.join(0)
            rescue Errno::ESRCH
              nil
            ensure
              wait.join
            end
          end
        end
      rescue Errno::ENOENT
        raise Unavailable, "PDF processing is unavailable. Please retry later.", cause: nil
      end

      def reject_active_content(output)
        structure = JSON.parse(output, max_nesting: 40)
        remaining = [structure]
        until remaining.empty?
          node = remaining.pop
          if node.is_a?(Hash)
            invalid! if node.key?("/JS") || node.key?("/JavaScript") || node.key?("/EmbeddedFiles") ||
              node["/Type"] == "/EmbeddedFile" || ACTIVE_ACTIONS.include?(node["/S"])
            remaining.concat(node.values)
          elsif node.is_a?(Array)
            remaining.concat(node)
          end
        end
        structure
      end

      def check_page_boxes(structure, count)
        invalid! unless structure.is_a?(Hash) && structure["qpdf"].is_a?(Array)
        objects = structure["qpdf"]&.last
        pages = structure["pages"]
        invalid! unless objects.is_a?(Hash) && pages.is_a?(Array) && pages.size == count
        pages.each do |item|
          invalid! unless item.is_a?(Hash)
          page = resolve_pdf_value(item["object"], objects)
          invalid! unless page.is_a?(Hash) && page["/Type"] == "/Page"
          media = inherited_pdf_value(page, "/MediaBox", objects)
          crop = inherited_pdf_value(page, "/CropBox", objects) || media
          unit = resolve_pdf_value(page["/UserUnit"], objects)
          unit = 1 if unit.nil?
          invalid! unless (unit.is_a?(Integer) || unit.is_a?(Float)) && unit.finite? && unit.positive?
          [media, crop].each { |box| check_box(box, unit, objects) }
        end
      end

      def check_structure(structure, count)
        check_page_boxes(structure, count)
      end

      def valid_form?(form) = form == "none"

      def check_box(box, unit, objects)
        box = resolve_pdf_value(box, objects)
        invalid! unless box.is_a?(Array) && box.size == 4
        coordinates = box.map { |value| resolve_pdf_value(value, objects) }
        invalid! unless coordinates.all? { |value| (value.is_a?(Integer) || value.is_a?(Float)) && value.finite? }
        width, height = coordinates[2] - coordinates[0], coordinates[3] - coordinates[1]
        unless self.class.valid_dimensions?(width, height) && self.class.valid_dimensions?(width * unit, height * unit)
          raise InvalidDocument, GEOMETRY_MESSAGE, cause: nil
        end
      end

      def inherited_pdf_value(page, key, objects)
        100.times do
          invalid! unless page.is_a?(Hash)
          value = resolve_pdf_value(page[key], objects)
          return value unless value.nil?
          return nil unless page["/Parent"]

          page = resolve_pdf_value(page["/Parent"], objects)
        end
        invalid!
      end

      def resolve_pdf_value(value, objects)
        100.times do
          return value unless value.is_a?(String) && value.match?(/\A\d+ \d+ R\z/)

          object = objects["obj:#{value}"]
          invalid! unless object.is_a?(Hash) && object.key?("value")
          value = object["value"]
        end
        invalid!
      end

      def parse(output)
        # Poppler prints untrusted document metadata before its own page summary.
        summary = output.rindex(/^Pages:[ \t]+\d+[ \t]*$/)
        invalid! unless summary
        header = output[...summary]
        invalid! unless valid_form?(header.scan(/^Form:[ \t]+(.+?)[ \t]*$/).last&.first) &&
          header.scan(/^JavaScript:[ \t]+(.+?)[ \t]*$/).last == ["no"]
        output = output[summary..]
        count = output[/\APages:[ \t]+(\d+)/, 1].to_i
        invalid! unless count.between?(1, self.class::MAX_PAGES)
        invalid! unless output.match?(/^Encrypted:[ \t]+no[ \t]*$/)
        page_geometry(output, count)
      end

      def check_images(output)
        header, separator, *rows = output.lines.map(&:strip)
        invalid! unless header&.match?(/\Apage\s+num\s+type\s+width\s+height\b/) && separator&.match?(/\A-+\z/)
        rows.each do |row|
          dimensions = row.match(/\A\d+\s+\d+\s+\S+\s+(\d+)\s+(\d+)\s+/)
          invalid! unless dimensions
          width, height = dimensions.captures.map(&:to_i)
          invalid! unless width.positive? && height.positive?
          if width * height > MAX_IMAGE_PIXELS
            raise InvalidDocument, "PDF images must be 16 megapixels or smaller. Export a lower-resolution PDF and retry.", cause: nil
          end
        end
      end

      def page_geometry(output, count)
        dimensions = output.scan(/^Page[ \t]+(\d+)[ \t]+size:[ \t]+([\d.]+) x ([\d.]+) pts/)
        rotations = output.scan(/^Page[ \t]+(\d+)[ \t]+rot:[ \t]+(-?\d+)/).to_h
        invalid! unless dimensions.length == count && rotations.length == count
        dimensions.each_with_index.map do |(number, width, height), index|
          width, height = width.to_f, height.to_f
          rotation = rotations.fetch(number).to_i
          invalid! unless number.to_i == index + 1 && width.finite? && height.finite? &&
            width.positive? && height.positive? && rotation.modulo(90).zero?
          raise InvalidDocument, GEOMETRY_MESSAGE, cause: nil unless self.class.valid_dimensions?(width, height)
          { "width" => width, "height" => height, "rotation" => rotation.modulo(360) }
        end
      end

      def invalid!
        raise InvalidDocument, INVALID_MESSAGE, cause: nil
      end
  end
end
