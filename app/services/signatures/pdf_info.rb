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
    MAX_OUTPUT_BYTES = 65_536
    MAX_STRUCTURE_BYTES = 1024 * 1024
    TIMEOUT_SECONDS = 5
    ACTIVE_ACTIONS = %w[/JavaScript /Launch /SubmitForm /ImportData /GoToR /GoToE /Rendition /Movie /Sound].freeze
    INVALID_MESSAGE = "Upload a flat, unlocked PDF of at most 5 MiB and 100 pages."

    def initialize(path)
      @path = path
    end

    def process
      invalid! unless File.file?(@path) && File.size(@path).between?(1, MAX_BYTES)
      invalid! unless File.binread(@path, 5) == "%PDF-"
      pages = parse(capture("pdfinfo", "-box", "-f", "1", "-l", MAX_PAGES.to_s, @path))
      reject_active_content(capture("qpdf", "--json", "--json-key=qpdf", "--json-stream-data=none", @path,
        output_limit: MAX_STRUCTURE_BYTES))
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
        remaining = [JSON.parse(output, max_nesting: 40)]
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
      end

      def parse(output)
        # Poppler prints untrusted document metadata before its own page summary.
        summary = output.rindex(/^Pages:[ \t]+\d+[ \t]*$/)
        invalid! unless summary
        header = output[...summary]
        invalid! unless header.scan(/^Form:[ \t]+(.+?)[ \t]*$/).last == ["none"] &&
          header.scan(/^JavaScript:[ \t]+(.+?)[ \t]*$/).last == ["no"]
        output = output[summary..]
        count = output[/\APages:[ \t]+(\d+)/, 1].to_i
        invalid! unless count.between?(1, MAX_PAGES)
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
          { "width" => width, "height" => height, "rotation" => rotation.modulo(360) }
        end
      end

      def invalid!
        raise InvalidDocument, INVALID_MESSAGE, cause: nil
      end
  end
end
