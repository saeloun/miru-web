# frozen_string_literal: true

require "rails_helper"

RSpec.describe MCP::Miru::ProAccessChecker do
  describe ".pro_access?" do
    let(:authorization) { "Bearer token" }

    it "returns true when subscription response has pro_access true" do
      response = instance_double(MCP::Miru::ApiProxy::Result, success?: true, json: { "pro_access" => true })
      allow(MCP::Miru::ApiProxy).to receive(:request).and_return(response)

      expect(described_class.pro_access?(authorization:)).to eq(true)
    end

    it "returns false when response is unsuccessful" do
      response = instance_double(MCP::Miru::ApiProxy::Result, success?: false, json: { "pro_access" => true })
      allow(MCP::Miru::ApiProxy).to receive(:request).and_return(response)

      expect(described_class.pro_access?(authorization:)).to eq(false)
    end

    it "returns false when response payload is not a hash" do
      response = instance_double(MCP::Miru::ApiProxy::Result, success?: true, json: [])
      allow(MCP::Miru::ApiProxy).to receive(:request).and_return(response)

      expect(described_class.pro_access?(authorization:)).to eq(false)
    end

    it "returns false when proxy request raises" do
      allow(MCP::Miru::ApiProxy).to receive(:request).and_raise(StandardError, "boom")

      expect(described_class.pro_access?(authorization:)).to eq(false)
    end
  end
end
