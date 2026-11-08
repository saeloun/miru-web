# frozen_string_literal: true

require "rails_helper"

RSpec.describe PaymentProviders::RazorpayOauthClient do
  let(:client) { described_class.new }
  let(:callback) { "https://app.miru.example/payments/razorpay/callback" }
  let(:tokens) do
    { token_type: "Bearer", access_token: "synthetic-access", refresh_token: "synthetic-refresh",
      public_token: "rzp_test_oauth_synthetic", expires_in: 7862400, razorpay_account_id: "acc_synthetic" }
  end

  around do |example|
    VCR.turned_off do
      WebMock.disable_net_connect!
      example.run
    end
  end

  before do
    allow(ENV).to receive(:[]).and_call_original
    { "ENABLED" => "true", "CLIENT_ID" => "synthetic-client", "CLIENT_SECRET" => "synthetic-secret",
      "REDIRECT_URI" => callback, "MODE" => "test" }.each do |key, value|
      allow(ENV).to receive(:[]).with("RAZORPAY_OAUTH_#{key}").and_return(value)
    end
  end

  def token_response(body: tokens, status: 200)
    stub_request(:post, "https://auth.razorpay.com/token")
      .to_return(status:, body: body.is_a?(String) ? body : body.to_json)
  end

  it "builds the hosted authorization URL with only collection access and no secret" do
    state = "a" * 64
    uri = URI(client.authorization_url(state:))
    expect([uri.scheme, uri.host, uri.path]).to eq(["https", "auth.razorpay.com", "/authorize"])
    expect(URI.decode_www_form(uri.query).to_h).to eq("client_id" => "synthetic-client", "response_type" => "code",
      "redirect_uri" => callback, "scope" => "read_write", "state" => state)
    expect(uri.to_s).not_to include("synthetic-secret", "rx_read_write")
    expect(client.inspect).not_to include("synthetic-secret")
  end

  it "exchanges the decoded authorization code and keeps an explicit environment" do
    request = token_response.with(body: { client_id: "synthetic-client", client_secret: "synthetic-secret",
      grant_type: "authorization_code", redirect_uri: callback, code: "synthetic-code", mode: "test" })
    result = client.exchange("synthetic-code")
    expect(result).to include("access_token" => "synthetic-access", "refresh_token" => "synthetic-refresh",
      "razorpay_account_id" => "acc_synthetic")
    expect(request).to have_been_requested.once
  end

  it "accepts the documented string expiry when rotating tokens without a repeated account ID" do
    token_response(body: tokens.except(:razorpay_account_id).merge(expires_in: "3600"))
    result = client.refresh("synthetic-refresh", account_id: "acc_synthetic")
    expect(result).to include("expires_in" => 3600, "razorpay_account_id" => "acc_synthetic")
    expect(a_request(:post, "https://auth.razorpay.com/token").with(body: hash_including(
      grant_type: "refresh_token", refresh_token: "synthetic-refresh"))).to have_been_made.once
  end

  {
    missing_access: { access_token: nil }, missing_refresh: { refresh_token: nil },
    wrong_type: { token_type: "Basic" }, bad_expiry: { expires_in: 1.5 }, zero_expiry: { expires_in: 0 },
    wrong_mode: { public_token: "rzp_live_oauth_synthetic" }, missing_account: { razorpay_account_id: nil },
    malformed_account: { razorpay_account_id: "https://other.example" }, injected_token: { access_token: "bad\r\nheader" }
  }.each do |name, values|
    it "rejects #{name} token responses" do
      token_response(body: tokens.merge(values))
      expect { client.exchange("synthetic-code") }.to raise_error(described_class::Error, "Razorpay returned an invalid OAuth response")
    end
  end

  it "rejects a different merchant during token refresh" do
    token_response(body: tokens.merge(razorpay_account_id: "acc_other"))
    expect { client.refresh("synthetic-refresh", account_id: "acc_synthetic") }.to raise_error(described_class::Error)
  end

  it "keeps validation cleanup private and excludes it from exception serialization" do
    token_response(body: tokens.merge(expires_in: 0, refresh_token: "private_returned_refresh"))
    expect { client.exchange("synthetic-code") }.to raise_error(described_class::Error) do |error|
      expect(error.private_methods).to include(:cleanup_grant)
      expect([error.inspect, error.full_message, error.as_json.to_json, error.to_json].join).not_to include("private_returned_refresh", "synthetic-access")
      expect(error.cause).to be_nil
    end
  end

  { missing: nil, oversized: "x" * 16_385, injected: "unsafe\r\nrefresh" }.each do |invalid, refresh_token|
    it "does not retain #{invalid} refresh material from an invalid response" do
      token_response(body: tokens.merge(expires_in: 0, refresh_token:))
      expect { client.exchange("synthetic-code") }.to raise_error(described_class::Error) do |error|
        expect(error.__send__(:cleanup_grant)).to be_nil
      end
    end
  end

  ["not-json", "[]", '{"access_token":"one","access_token":"two"}'].each do |body|
    it "rejects malformed or ambiguous JSON #{body.first(10)}" do
      token_response(body:)
      expect { client.exchange("synthetic-code") }.to raise_error(described_class::Error)
    end
  end

  it "does not reflect credential-bearing provider errors or follow redirects" do
    token_response(body: { error: "synthetic-access synthetic-secret" }, status: 302)
    expect { client.exchange("synthetic-code") }.to raise_error(described_class::Error, "Razorpay OAuth request failed")
  end

  it "bounds the response size" do
    token_response(body: "x" * (262_144 + 1))
    expect { client.exchange("synthetic-code") }.to raise_error(described_class::Error)
  end

  it "reports timeouts without request credentials" do
    stub_request(:post, "https://auth.razorpay.com/token").to_timeout
    expect { client.exchange("synthetic-code") }.to raise_error(described_class::Error, "Razorpay OAuth request failed")
  end

  it "review regression: sanitizes DNS failures" do
    stub_request(:post, "https://auth.razorpay.com/token").to_raise(SocketError.new("synthetic DNS detail"))
    expect { client.exchange("synthetic-code") }.to raise_error(described_class::Error, "Razorpay OAuth request failed")
  end

  [Net::HTTPBadResponse, Net::ProtocolError, Zlib::DataError].each do |error_class|
    it "sanitizes malformed HTTP responses raised as #{error_class}" do
      stub_request(:post, "https://auth.razorpay.com/token").to_raise(error_class.new("private upstream detail"))
      expect { client.exchange("synthetic-code") }.to raise_error(described_class::Error, "Razorpay OAuth request failed") do |error|
        expect(error.cause).to be_nil
      end
    end
  end

  it "revokes the grant using the documented fixed endpoint" do
    request = stub_request(:post, "https://auth.razorpay.com/revoke").with(body: {
      client_id: "synthetic-client", client_secret: "synthetic-secret", token_type_hint: "refresh_token",
      token: "synthetic-refresh" }.to_json).to_return(status: 200, body: { message: "Token Revoked" }.to_json)
    expect(client.revoke("synthetic-refresh")).to be(true)
    expect(request).to have_been_requested.once
  end

  it "does not claim revocation was confirmed by an unrelated successful JSON body" do
    stub_request(:post, "https://auth.razorpay.com/revoke").to_return(status: 200, body: "{}")
    expect { client.revoke("synthetic-refresh") }.to raise_error(described_class::Error)
  end

  it "requires the expected merchant on every refresh call" do
    expect { client.refresh("synthetic-refresh") }.to raise_error(ArgumentError, /account_id/)
    expect(WebMock).not_to have_requested(:post, "https://auth.razorpay.com/token")
  end

  [nil, "", "other-merchant"].each do |account_id|
    it "rejects an invalid expected merchant #{account_id.inspect} before refreshing" do
      token_response
      expect { client.refresh("synthetic-refresh", account_id:) }.to raise_error(described_class::Error)
      expect(WebMock).not_to have_requested(:post, "https://auth.razorpay.com/token")
    end
  end

  it "rejects malformed authorization state before constructing a provider URL" do
    expect { client.authorization_url(state: "untrusted") }.to raise_error(described_class::Error)
  end

  { "ENABLED" => "false", "CLIENT_ID" => "", "CLIENT_SECRET" => "", "MODE" => "unknown",
    "REDIRECT_URI" => "https://user:secret@other.example/callback" }.each do |key, value|
    it "fails closed for invalid #{key} configuration" do
      allow(ENV).to receive(:[]).with("RAZORPAY_OAUTH_#{key}").and_return(value)
      expect { client }.to raise_error(described_class::Unavailable)
      expect(WebMock).not_to have_requested(:post, "https://auth.razorpay.com/token")
    end
  end
end
