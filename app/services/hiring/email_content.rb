# frozen_string_literal: true

module Hiring
  class EmailContent
    class Malformed < StandardError; end

    def initialize(source)
      @source = source
      raise Malformed unless source.b.byteslice(0, 1_024).match?(/\A[!-9;-~]+:/)

      @limited_reason = limit_reason(source)
      return if @limited_reason

      @mail = Mail.from_source(source)
      raise Malformed if @mail.header.fields.empty?

      @unverified_forward = false
      @ambiguous_forward = false
      3.times do
        originals = @mail.parts.select { |part| part.mime_type == "message/rfc822" }
        break if originals.empty?
        unless originals.one?
          @ambiguous_forward = true
          break
        end

        original = originals.first.body.decoded
        @limited_reason = limit_reason(original)
        break if @limited_reason

        @mail = Mail.from_source(original)
      end
      if !@ambiguous_forward && !@limited_reason && @mail.parts.any? { |part| part.mime_type == "message/rfc822" }
        @limited_reason = "forwarding_depth"
      end
      @unverified_forward = @mail.subject.to_s.match?(/\A(?:fwd?|forward):/i)
    rescue Mail::Field::ParseError, ArgumentError
      raise Malformed
    end

    def email
      return if @limited_reason
      return @email if defined?(@email)

      addresses = @mail.from
      value = addresses.first.to_s.strip.downcase if addresses&.one?
      @email = value if value && value.bytesize <= 254 && URI::MailTo::EMAIL_REGEXP.match?(value)
    end

    def key(message_id = nil)
      return if @limited_reason

      message_id ||= @mail.message_id
      value = message_id.to_s.strip
      return if email.nil? || value.empty? || value.bytesize > 998 || value.match?(/[[:cntrl:]]/)

      Digest::SHA256.hexdigest([email, value].to_json)
    end

    def references
      return [] if @limited_reason

      [*@mail.references, *@mail.in_reply_to].flat_map { |value| value.to_s.scan(/[^<>\s]+/) }.last(20)
    end

    def full_name
      return unless email

      Mail::Address.new(@mail[:from].value).display_name.to_s.strip.presence || email
    end

    def attachments
      return [] if @limited_reason

      @attachments ||= @mail.attachments.map do |part|
        data = part.decoded.b
        { "filename" => ActiveStorage::Filename.new(part.filename.to_s).sanitized.first(255),
          "content_type" => part.mime_type.presence || "application/octet-stream", "bytes" => data.bytesize, "data" => data }
      end
    end

    def review_reason
      return @limited_reason if @limited_reason
      return "ambiguous_forward" if @ambiguous_forward
      return "forwarded_sender_unverified" if @unverified_forward
      return "invalid_sender" unless email
      return "missing_message_id" unless key
      return "invalid_sender_name" unless full_name.length.between?(1, 200) && !full_name.match?(/[[:cntrl:]]/)
      return "invalid_date" if @mail[:date] && !@mail.date.respond_to?(:iso8601)
      return "automated_message" if @mail[:auto_submitted] && @mail[:auto_submitted].value != "no"
      return "attachment_limit" if attachments.size > 10 || attachments.any? { |file| file["bytes"] > 10.megabytes }

      "application_not_identified" unless @mail.subject.to_s.match?(/\A(?:job application|application for|applying for)\b/i) && attachments.any?
    end

    def fingerprint
      return @fingerprint ||= Digest::SHA256.hexdigest(@source) if @limited_reason

      @fingerprint ||= begin
        parts = [@mail, *@mail.all_parts].reject(&:multipart?)
        contents = parts.map do |part|
          data = part.body.decoded.b
          data = data.gsub(/\r\n?/, "\n") if part.text? || part.mime_type.nil?
          [part.mime_type, part.filename, Digest::SHA256.hexdigest(data)]
        end
        Digest::SHA256.hexdigest([email, full_name, @mail.subject.to_s, contents].to_json)
      end
    end

    def details
      date = @mail&.date
      { "email" => email, "full_name" => full_name, "subject" => @mail&.subject.to_s.first(1_000),
        "original_date" => date.respond_to?(:iso8601) ? date.iso8601 : nil,
        "text" => body.first(50_000), "text_truncated" => @limited_reason.present? || body.length > 50_000,
        "fingerprint" => fingerprint, "attachments" => attachments.map { |file| file.except("data") } }
    end

    private

      def limit_reason(source)
        raw = source.b
        header_bytes = [raw.index("\r\n\r\n"), raw.index("\n\n")].compact.min || raw.bytesize
        return "header_limit" if header_bytes > 64.kilobytes

        declarations, separators = 0, 0
        raw.each_line do |line|
          declarations += 1 if line.match?(/\AContent-Type:/i)
          # shortcut: Separator-heavy text is held for review; use a streaming parser if this becomes common.
          separators += 1 if line.start_with?("--")
          return "mime_part_limit" if declarations > 100 || separators > 101
        end
        nil
      end

      def body
        return @body = "" if @limited_reason
        return @body if defined?(@body)

        part = @mail.text_part || @mail.html_part || (@mail unless @mail.multipart?)
        return @body = "" unless part

        encoding = Encoding.find(part.charset.presence || "UTF-8") rescue Encoding::UTF_8
        text = part.body.decoded.force_encoding(encoding).encode("UTF-8", invalid: :replace, undef: :replace)
          .gsub(/\r\n?/, "\n").tr("\0", "\uFFFD")
        @body = part.mime_type == "text/html" ? ActionController::Base.helpers.strip_tags(text) : text
      end
  end
end
