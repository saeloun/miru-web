# frozen_string_literal: true

# Middleware to handle encoding compatibility issues in requests.
# Fixes Encoding::CompatibilityError when UTF-16LE encoded data is sent in
# query strings or POST bodies (e.g., from certain browsers, bots, or malformed requests).
class EncodingSanitizer
  def initialize(app)
    @app = app
  end

  def call(env)
    # Sanitize URL-related env vars
    %w[QUERY_STRING REQUEST_URI PATH_INFO HTTP_REFERER].each do |key|
      sanitize_encoding(env, key)
    end

    # Wrap rack.input to sanitize POST body
    if env["rack.input"]
      env["rack.input"] = SanitizedInput.new(env["rack.input"])
    end

    @app.call(env)
  end

  private

    def sanitize_encoding(env, key)
      return unless env[key]

      value = env[key]
      return if value.encoding == Encoding::UTF_8 && value.valid_encoding?

      env[key] = force_utf8(value)
    end

    def force_utf8(value)
      value
        .encode(Encoding::UTF_8, invalid: :replace, undef: :replace, replace: "")
    rescue Encoding::UndefinedConversionError, Encoding::InvalidByteSequenceError
      value.dup.force_encoding(Encoding::UTF_8).scrub("")
    end

    # Wrapper for rack.input that sanitizes encoding on read
    class SanitizedInput
      def initialize(input)
        @input = input
      end

      def read(*args)
        data = @input.read(*args)
        return data unless data.is_a?(String)

        sanitize(data)
      end

      def gets(*args)
        data = @input.gets(*args)
        return data unless data.is_a?(String)

        sanitize(data)
      end

      def each(&block)
        @input.each { |line| block.call(sanitize(line)) }
      end

      def rewind
        @input.rewind
      end

      def close
        @input.close if @input.respond_to?(:close)
      end

      private

        def sanitize(data)
          return data if data.encoding == Encoding::UTF_8 && data.valid_encoding?

          # Force to binary first, then encode to UTF-8
          data.dup.force_encoding(Encoding::ASCII_8BIT)
            .encode(Encoding::UTF_8, invalid: :replace, undef: :replace, replace: "")
        rescue Encoding::UndefinedConversionError, Encoding::InvalidByteSequenceError
          data.dup.force_encoding(Encoding::UTF_8).scrub("")
        end
    end
end

# Insert before ActionDispatch::Static to ensure we sanitize encoding
# before any Rack middleware tries to parse the request.
# This must run before Rack::MethodOverride which parses POST bodies.
Rails.application.config.middleware.insert_before ActionDispatch::Static, EncodingSanitizer
