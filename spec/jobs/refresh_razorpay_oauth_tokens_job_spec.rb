# frozen_string_literal: true

require "rails_helper"

RSpec.describe RefreshRazorpayOauthTokensJob do
  around do |example|
    VCR.turned_off do
      WebMock.disable_net_connect!
      example.run
    end
  end

  prepend_before do
    stub_request(:get, %r{\Ahttps://api\.pwnedpasswords\.com/range/}).to_return(status: 200, body: "")
  end

  before { stub_razorpay_oauth_env }

  def connected_provider(account = "acc_synthetic")
    company = create(:company)
    actor = create(:user, current_workspace: company)
    create(:employment, company:, user: actor, resigned_at: nil)
    actor.add_role(:admin, company)
    provider = create(:payments_provider, company:, name: "razorpay")
    connection = PaymentProviders::RazorpayOauthConnection.new(provider:, actor:)
    state = connection.start!
    stub_razorpay_token(body: razorpay_oauth_tokens(razorpay_account_id: account, refresh_token: "refresh_#{account}"))
    connection.complete!(state:, browser_state: state, code: "synthetic-code")
    provider.reload
  end

  def refresh_request(account = "acc_synthetic")
    stub_request(:post, RazorpayOauthHelpers::TOKEN_URL).with(body: hash_including(
      "grant_type" => "refresh_token", "refresh_token" => "refresh_#{account}"))
  end

  def rotated_tokens(account = "acc_synthetic")
    razorpay_oauth_tokens(razorpay_account_id: account, access_token: "rotated-access",
      refresh_token: "rotated-#{account}", expires_in: 90.days.to_i)
  end

  it "maintains a quiet connection with invoices disabled and rotates only once across repeated runs" do
    provider = connected_provider
    stub_razorpay_oauth_env(COLLECTIONS_ENABLED: "false")
    refresh = refresh_request.to_return(status: 200, body: rotated_tokens.to_json)

    travel 2.days do
      2.times { described_class.perform_now }
    end

    expect(refresh).to have_been_requested.once
    expect(provider.reload).to be_connected
    expect(provider.razorpay_oauth_credentials).to include("access_token" => "rotated-access", "refresh_token" => "rotated-acc_synthetic")
    expect(provider).not_to be_enabled
    expect(provider.enabled_on_invoices?).to be(false)
    expect(provider.settings["oauth_refresh_reservation"]).to be_nil
  end

  it "makes no token calls when account connection is switched off" do
    provider = connected_provider
    stub_razorpay_oauth_env(ENABLED: "false")

    travel(2.days) { described_class.perform_now }

    expect(refresh_request).not_to have_been_requested
    expect(provider.reload).to be_connected
  end

  it "leaves fresh tokens and legacy or ended connections alone" do
    fresh = connected_provider
    ended = connected_provider("acc_ended")
    ended.update!(connected: false)
    pending = connected_provider("acc_pending")
    pending.update!(settings: pending.settings.merge("oauth_status" => "pending"))
    legacy = create(:payments_provider, name: "razorpay", company: create(:company), connected: true)
    stripe = create(:payments_provider, name: "stripe", company: create(:company), connected: true)
    snapshots = [fresh, ended, pending, legacy, stripe].to_h { |provider| [provider.id, provider.settings.deep_dup] }

    described_class.perform_now

    snapshots.each { |id, settings| expect(PaymentsProvider.find(id).settings).to eq(settings) }
    expect(a_request(:post, RazorpayOauthHelpers::TOKEN_URL).with(body: hash_including("grant_type" => "refresh_token"))).not_to have_been_made
  end

  it "reports a failed rotation without retrying an uncertain token or blocking the next company" do
    failed = connected_provider("acc_failed")
    healthy = connected_provider("acc_healthy")
    failure = refresh_request("acc_failed").to_timeout
    success = refresh_request("acc_healthy").to_return(status: 200, body: rotated_tokens("acc_healthy").to_json)
    allow(Rails.error).to receive(:report)

    travel(2.days) { 2.times { described_class.perform_now } }

    expect(failure).to have_been_requested.once
    expect(success).to have_been_requested.once
    expect(failed.reload).not_to be_connected
    expect(failed.settings["oauth_refresh_uncertain"]).to be(true)
    expect(failed.razorpay_oauth_credentials["refresh_token"]).to eq("refresh_acc_failed")
    expect(healthy.reload).to be_connected
    expect(healthy.razorpay_oauth_credentials["refresh_token"]).to eq("rotated-acc_healthy")
    expect(Rails.error).to have_received(:report).with(an_instance_of(PaymentProviders::RazorpayOauthConnection::Error),
      hash_including(handled: true, context: hash_including(payments_provider_id: failed.id, company_id: failed.company_id, recovery: /Payment Settings/))).once
  end

  it "keeps a connection recoverable after application configuration is restored" do
    provider = connected_provider
    ciphertext = provider.settings.fetch("razorpay_oauth_credentials_ciphertext")
    refresh = refresh_request.to_return(status: 200, body: rotated_tokens.to_json)
    allow(Rails.error).to receive(:report)

    travel 2.days do
      stub_razorpay_oauth_env(CLIENT_ID: "another-application")
      described_class.perform_now
      expect(provider.reload).to be_connected
      expect(provider.settings["razorpay_oauth_credentials_ciphertext"] == ciphertext).to be(true)
      expect(provider.settings["oauth_refresh_reservation"]).to be_nil
      expect(refresh).not_to have_been_requested

      stub_razorpay_oauth_env
      described_class.perform_now
    end

    expect(refresh).to have_been_requested.once
    expect(provider.reload).to be_connected
  end

  it "leaves an in-progress refresh to its owner instead of making a duplicate request" do
    provider = connected_provider
    allow(Rails.error).to receive(:report)

    travel 2.days do
      provider.update!(settings: provider.settings.merge("oauth_refresh_reservation" => "another-worker", "oauth_refresh_reserved_at" => Time.current.to_i))
      described_class.perform_now
    end

    expect(refresh_request).not_to have_been_requested
    expect(provider.reload).to be_connected
    expect(provider.settings["oauth_refresh_reservation"]).to eq("another-worker")
    expect(Rails.error).not_to have_received(:report)
  end
end
