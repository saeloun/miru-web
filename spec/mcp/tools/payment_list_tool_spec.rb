# frozen_string_literal: true

require "rails_helper"

RSpec.describe MCP::Miru::Tools::PaymentListTool do
  describe ".call" do
    let(:server_context) { { authorization: "Bearer token" } }

    it "returns a successful response payload when proxy call succeeds" do
      result = MCP::Miru::ApiProxy::Result.new(
        status: 200,
        headers: {},
        body: '{"payments":[]}',
        json: { "payments" => [] }
      )
      allow(described_class).to receive(:proxy_request).and_return(result)

      response = described_class.call(query: "acme", server_context:)
      payload = JSON.parse(response.content.first.fetch(:text))

      expect(response.error?).to eq(false)
      expect(payload["status"]).to eq(200)
    end

    it "returns stable error code and logs details when an exception occurs" do
      allow(described_class).to receive(:proxy_request).and_raise(StandardError, "connection timeout")
      allow(Rails.logger).to receive(:error)

      response = described_class.call(query: nil, server_context:)
      payload = JSON.parse(response.content.first.fetch(:text))

      expect(response.error?).to eq(true)
      expect(payload.dig("details", "code")).to eq("PAYMENT_LIST_FAILED")
      expect(payload.dig("details", "error")).to be_nil
      expect(Rails.logger).to have_received(:error).with(/\[MCP\]\[miru\.payment\.list\]/)
    end
  end
end
