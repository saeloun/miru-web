# frozen_string_literal: true

require "net/http"
require "stringio"

class Signatures::DocumensoClient
  class Error < StandardError; end
  class ConfigurationError < Error; end
  class Rejected < Error; end
  class Unavailable < Error; end
  class Uncertain < Error; end

  ID = /\A[A-Za-z0-9_-]{1,200}\z/
  JSON_LIMIT = 1.megabyte

  def initialize(api_key:)
    @origin = URI.parse(ENV["DOCUMENSO_ORIGIN"].to_s)
    unless valid_origin? && api_key.is_a?(String) && api_key.match?(/\A[!-~]{1,4096}\z/)
      raise ConfigurationError, "Configure the signing provider and company API key."
    end
    @api_key = api_key
  rescue URI::InvalidURIError
    raise ConfigurationError, "Configure the signing provider and company API key.", cause: nil
  end

  def inspect = "#<#{self.class.name}>"

  def origin = @origin.normalize.to_s.delete_suffix("/")

  def check_connection
    response = request(:get, "envelope?perPage=1")
    fail_response!(mutation: false) unless response["data"].is_a?(Array) && response["data"].size <= 1
    true
  end

  def create(payload:, files:)
    json = encode(payload)
    unless files.is_a?(Array) && files.size.between?(1, 10) &&
        files.all? { |file| file.is_a?(String) && file.bytesize.between?(1, Signatures::PdfInfo::MAX_BYTES) } &&
        files.sum(&:bytesize) <= 25.megabytes
      raise Rejected, "Choose up to ten supported PDFs within the upload limits."
    end
    parts = [["payload", json]] + files.each_with_index.map do |file, index|
      ["files", StringIO.new(file), { filename: "document-#{index + 1}.pdf", content_type: "application/pdf" }]
    end
    response = request(:post, "envelope/create", multipart: parts)
    fail_response!(mutation: true) unless response["id"].is_a?(String) && ID.match?(response["id"])
    response
  end

  def get(id) = request(:get, "envelope/#{identifier(id)}")

  def original(id)
    request(:get, "envelope/item/#{identifier(id)}/download?version=original", pdf: true)
  end

  def distribute(id)
    change("distribute", envelopeId: identifier(id))
  end

  def cancel(id)
    change("cancel", envelopeId: identifier(id), reason: "Cancelled in Miru")
  end

  def remind(id, recipient_ids:)
    unless recipient_ids.is_a?(Array) && recipient_ids.size.between?(1, 20) &&
        recipient_ids.all? { |value| value.is_a?(Integer) && value.positive? }
      raise Rejected, "Choose valid pending recipients."
    end
    change("redistribute", envelopeId: identifier(id), recipients: recipient_ids)
  end

  private

    def valid_origin?
      @origin.is_a?(URI::HTTP) && @origin.host.present? && @origin.userinfo.nil? &&
        ["", "/"].include?(@origin.path) && @origin.query.nil? && @origin.fragment.nil? &&
        (@origin.scheme == "https" || (!Rails.env.production? && %w[localhost 127.0.0.1 ::1].include?(@origin.hostname)))
    end

    def identifier(value)
      raise Rejected, "The signing provider ID is invalid." unless value.is_a?(String) && ID.match?(value)

      value
    end

    def encode(payload)
      data = JSON.generate(payload, max_nesting: 40)
      raise Rejected, "The signing configuration exceeds the supported limits." if data.bytesize > 128.kilobytes

      data
    rescue JSON::GeneratorError, JSON::NestingError
      raise Rejected, "The signing configuration is invalid.", cause: nil
    end

    def change(action, payload)
      response = request(:post, "envelope/#{action}", body: encode(payload))
      fail_response!(mutation: true) unless response["success"] == true
      response
    end

    def request(method, path, body: nil, multipart: nil, pdf: false)
      uri = URI.join(@origin.to_s, "/api/v2/#{path}")
      message = (method == :get ? Net::HTTP::Get : Net::HTTP::Post).new(uri,
        "Authorization" => @api_key, "Accept" => pdf ? "application/pdf" : "application/json", "Accept-Encoding" => "identity")
      if multipart
        message.set_form(multipart, "multipart/form-data")
      elsif body
        message["Content-Type"] = "application/json"
        message.body = body
      end
      data = nil
      Timeout.timeout(30) do
        Net::HTTP.start(uri.host, uri.port, nil, use_ssl: uri.scheme == "https", open_timeout: 10,
          read_timeout: 10, write_timeout: 10, max_retries: 0) do |connection|
          connection.request(message) { |response| data = read(response, mutation: method != :get, pdf:) }
        end
      end
      pdf ? data : parse(data, mutation: method != :get)
    rescue JSON::ParserError, Timeout::Error, IOError, SystemCallError, SocketError, OpenSSL::SSL::SSLError, Net::HTTPBadResponse, Net::ProtocolError
      fail_response!(mutation: method != :get)
    end

    def parse(data, mutation:)
      parsed = JSON.parse(data, max_nesting: 40)
      fail_response!(mutation:) unless parsed.is_a?(Hash)
      parsed
    end

    def read(response, mutation:, pdf:)
      code = response.code.to_i
      if code.between?(400, 499) && ![408, 429].include?(code)
        raise Rejected, "The signing provider rejected the request."
      end
      limit = pdf ? Signatures::PdfInfo::MAX_BYTES : JSON_LIMIT
      unless code.between?(200, 299) && response["Content-Encoding"].to_s.in?(["", "identity"]) &&
          response.content_type == (pdf ? "application/pdf" : "application/json") &&
          (response["Content-Length"].nil? || response["Content-Length"].match?(/\A\d{1,10}\z/) && response["Content-Length"].to_i <= limit)
        fail_response!(mutation:)
      end
      data = +"".b
      response.read_body do |chunk|
        fail_response!(mutation:) if data.bytesize + chunk.bytesize > limit
        data << chunk
      end
      data
    end

    def fail_response!(mutation:)
      if mutation
        raise Uncertain, "The signing outcome could not be confirmed. Reconcile its status before trying again.", cause: nil
      end
      raise Unavailable, "The signing provider could not be reached or verified. Try checking its status again.", cause: nil
    end
end
