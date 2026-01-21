# frozen_string_literal: true

require "rails_helper"

RSpec.describe EncodingSanitizer do
  let(:app) { ->(env) { [200, env, "OK"] } }
  let(:middleware) { described_class.new(app) }

  describe "#call" do
    context "with UTF-8 encoded query string" do
      it "passes through unchanged" do
        env = {
          "QUERY_STRING" => "name=test&value=hello",
          "REQUEST_URI" => "/test?name=test",
          "PATH_INFO" => "/test"
        }

        status, response_env, _body = middleware.call(env)

        expect(status).to eq(200)
        expect(response_env["QUERY_STRING"]).to eq("name=test&value=hello")
      end
    end

    context "with UTF-16LE encoded query string" do
      it "converts to valid UTF-8" do
        # Simulate UTF-16LE encoded string
        utf16_string = "test=value".encode(Encoding::UTF_16LE)
        env = {
          "QUERY_STRING" => utf16_string,
          "REQUEST_URI" => "/test",
          "PATH_INFO" => "/test"
        }

        status, response_env, _body = middleware.call(env)

        expect(status).to eq(200)
        expect(response_env["QUERY_STRING"].encoding).to eq(Encoding::UTF_8)
        expect(response_env["QUERY_STRING"]).to be_valid_encoding
      end
    end

    context "with invalid byte sequences" do
      it "sanitizes invalid bytes" do
        # String with invalid UTF-8 byte sequence
        invalid_string = (+"test=\xFF\xFEvalue").force_encoding(Encoding::UTF_8)
        env = {
          "QUERY_STRING" => invalid_string,
          "REQUEST_URI" => "/test",
          "PATH_INFO" => "/test"
        }

        status, response_env, _body = middleware.call(env)

        expect(status).to eq(200)
        expect(response_env["QUERY_STRING"]).to be_valid_encoding
      end
    end

    context "with nil values" do
      it "handles nil env values gracefully" do
        env = {
          "QUERY_STRING" => nil,
          "REQUEST_URI" => nil,
          "PATH_INFO" => "/test"
        }

        expect { middleware.call(env) }.not_to raise_error
      end
    end
  end

  describe EncodingSanitizer::SanitizedInput do
    describe "#read" do
      it "sanitizes UTF-16LE encoded POST body" do
        utf16_body = "name=test&email=user@example.com".encode(Encoding::UTF_16LE)
        input = StringIO.new(utf16_body)
        sanitized = described_class.new(input)

        result = sanitized.read

        expect(result.encoding).to eq(Encoding::UTF_8)
        expect(result).to be_valid_encoding
      end

      it "passes through valid UTF-8 unchanged" do
        body = "name=test&email=user@example.com"
        input = StringIO.new(body)
        sanitized = described_class.new(input)

        result = sanitized.read

        expect(result).to eq(body)
        expect(result.encoding).to eq(Encoding::UTF_8)
      end

      it "handles invalid byte sequences in POST body" do
        invalid_body = (+"name=test\xFF\xFE&value=data").force_encoding(Encoding::UTF_8)
        input = StringIO.new(invalid_body)
        sanitized = described_class.new(input)

        result = sanitized.read

        expect(result).to be_valid_encoding
      end
    end

    describe "#rewind" do
      it "delegates to underlying input" do
        input = StringIO.new("test data")
        sanitized = described_class.new(input)

        sanitized.read
        sanitized.rewind

        expect(sanitized.read).to include("test")
      end
    end

    describe "#each" do
      it "sanitizes each line" do
        body = "line1\nline2\nline3"
        input = StringIO.new(body)
        sanitized = described_class.new(input)

        lines = []
        sanitized.each { |line| lines << line }

        expect(lines.all?(&:valid_encoding?)).to be true
      end
    end
  end

  describe "middleware stack position" do
    it "is inserted before ActionDispatch::Static" do
      middlewares = Rails.application.middleware.map(&:name)
      sanitizer_index = middlewares.index("EncodingSanitizer")
      static_index = middlewares.index("ActionDispatch::Static")

      expect(sanitizer_index).to be < static_index
    end

    it "runs before Rack::MethodOverride" do
      middlewares = Rails.application.middleware.map(&:name)
      sanitizer_index = middlewares.index("EncodingSanitizer")
      method_override_index = middlewares.index("Rack::MethodOverride")

      expect(sanitizer_index).to be < method_override_index
    end
  end
end
