# frozen_string_literal: true

class Webhooks::DocumensoController < ActionController::API
  MAX_BYTES = 1.megabyte

  def events
    response.headers["Cache-Control"] = "no-store"
    return head 401 unless authenticated?

    raw = request.body.read(MAX_BYTES + 1)
    return head 413 if raw.bytesize > MAX_BYTES

    data = JSON.parse(raw, max_nesting: 20)
    payload = data["payload"] if data.is_a?(Hash)
    unless payload.is_a?(Hash) && SignatureCallback::EVENTS.include?(data["event"]) &&
        valid_id?(payload["envelopeId"]) && valid_id?(payload["externalId"]) &&
        data["createdAt"].is_a?(String) && data["createdAt"].bytesize <= 40
      return head 400
    end
    Time.iso8601(data.fetch("createdAt"))
    revision = SignatureRequestRevision.find_by(signature_connection_id: params[:connection_id],
      provider_envelope_id: payload.fetch("envelopeId"), operation_id: payload.fetch("externalId"))
    return head 202 unless revision

    digest = Digest::SHA256.hexdigest(JSON.generate(data.values_at("event", "createdAt") + payload.values_at("envelopeId", "externalId")))
    receipt = revision.signature_callbacks.create_or_find_by!(digest:) { |record| record.event = data.fetch("event") }
    head(receipt.enqueue! ? 202 : 503)
  rescue JSON::ParserError, JSON::NestingError, ArgumentError
    head 400
  end

  private

    def valid_id?(value) = value.is_a?(String) && Signatures::DocumensoClient::ID.match?(value)

    def authenticated?
      expected = ENV["DOCUMENSO_WEBHOOK_SECRET"]
      supplied = request.get_header("HTTP_X_DOCUMENSO_SECRET")
      expected.is_a?(String) && expected.bytesize.between?(32, 4096) && supplied.is_a?(String) &&
        supplied.bytesize <= 4096 && ActiveSupport::SecurityUtils.secure_compare(expected, supplied)
    end
end
