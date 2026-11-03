# frozen_string_literal: true

require "rails_helper"

RSpec.describe PaymentProviders::RazorpayOauthConnection do
  before do
    # Refresh intent must be tested with real commits, not a surrounding example transaction.
    DatabaseCleaner.clean
    DatabaseCleaner.strategy = :deletion, { except: %w[ar_internal_metadata schema_migrations] }
  end

  let(:company) { create(:company) }
  let(:actor) { create(:user, current_workspace: company) }
  let!(:employment) { create(:employment, user: actor, company:, resigned_at: nil) }
  let(:provider) { create(:payments_provider, company:, name: "razorpay", settings: { platform_fee_percent: "0" }) }
  let(:identity) { { "client_id" => "synthetic_app", "mode" => "test", "redirect_uri" => "http://127.0.0.1:3000/payments/razorpay/callback" } }
  let(:tokens) do
    { "access_token" => "synthetic_access", "refresh_token" => "synthetic_refresh", "public_token" => "rzp_test_oauth_synthetic",
      "expires_in" => 3600, "razorpay_account_id" => "acc_synthetic" }
  end
  let(:client) { instance_double(PaymentProviders::RazorpayOauthClient, identity:, exchange: tokens, refresh: tokens, revoke: true) }
  let(:connection) { described_class.new(provider:, actor:, client:) }

  around do |example|
    VCR.turned_off do
      WebMock.disable_net_connect!
      example.run
    end
  end

  prepend_before do
    stub_request(:get, %r{\Ahttps://api\.pwnedpasswords\.com/range/}).to_return(status: 200, body: "")
  end

  before { actor.add_role(:admin, company) }

  def complete(connection = self.connection, **options)
    state = connection.start!
    connection.complete!(state:, browser_state: state, code: "synthetic_code", **options)
  end

  it "stores only a digest until consent and encrypts credentials without enabling financial operations" do
    state = connection.start!
    expect(state).to match(/\A[0-9a-f]{64}\z/)
    expect(provider.reload.settings.to_json).not_to include(state)
    expect(connection.complete!(state:, browser_state: state, code: "synthetic_code")).to eq(:connected)
    expect(provider.reload.settings.to_json).not_to include("synthetic_access", "synthetic_refresh", "synthetic_code")
    expect(connection.access_token).to eq("synthetic_access")
    expect(connection.status).to eq(status: "connected", account_id: "acc_synthetic", mode: "test", merchant_status: nil, collections_enabled: false,
      collections_ready: false, collections_blocker: "collections_disabled", payouts_ready: false, recovery_available: false,
      cleanup_pending: false, payments_needing_review: [])
    expect(provider).not_to be_enabled
    expect(provider).not_to be_razorpay_configured
    expect(provider.settings["authentication_mode"]).to eq("oauth")
    expect(connection.inspect).not_to include("synthetic_access", "synthetic_refresh", state)
  end

  it "does not initialize the HTTP client for a status read" do
    expect(PaymentProviders::RazorpayOauthClient).not_to receive(:new)
    expect(described_class.new(provider:, actor:).status[:status]).to eq("disconnected")
  end

  it "leaves legacy API keys and financial settings untouched" do
    provider.update!(key_id: "rzp_test_legacy", key_secret: "legacy_secret", connected: true)
    expect { connection.start! }.to raise_error(described_class::Error)
    expect(provider.reload.key_secret).to eq("legacy_secret")
    expect(provider).to be_connected
    expect(client).not_to have_received(:exchange)
    expect { connection.access_token }.to raise_error(described_class::Error)
    expect(provider.reload).to be_connected
  end

  it "rejects missing configuration without creating state" do
    allow(PaymentProviders::RazorpayOauthClient).to receive(:new).and_raise(PaymentProviders::RazorpayOauthClient::Unavailable, "secret")
    expect { described_class.new(provider:, actor:).start! }.to raise_error(described_class::Error, /configured/)
    expect(provider.reload.settings).not_to have_key("oauth_state")
  end

  it "rejects a wrong browser state and an expired state before any exchange" do
    state = connection.start!
    expect { connection.complete!(state:, browser_state: "wrong", code: "synthetic_code") }.to raise_error(described_class::Error)
    travel 11.minutes do
      expect { connection.complete!(state:, browser_state: state, code: "synthetic_code") }.to raise_error(described_class::Error)
    end
    expect(client).not_to have_received(:exchange)
  end

  it "binds consent to the initiating actor" do
    state = connection.start!
    other = create(:user, current_workspace: company)
    create(:employment, user: other, company:, resigned_at: nil)
    other.add_role(:admin, company)
    other_connection = described_class.new(provider:, actor: other, client:)
    expect { other_connection.complete!(state:, browser_state: state, code: "synthetic_code") }.to raise_error(described_class::Error)
    expect(client).not_to have_received(:exchange)
  end

  it "checks current workspace and active membership again on callback" do
    state = connection.start!
    actor.update!(current_workspace: create(:company))
    expect { connection.complete!(state:, browser_state: state, code: "synthetic_code") }.to raise_error(described_class::Error)
    actor.update!(current_workspace: company)
    employment.update!(resigned_at: Date.yesterday)
    expect { connection.complete!(state:, browser_state: state, code: "synthetic_code") }.to raise_error(described_class::Error)
    expect(client).not_to have_received(:exchange)
  end

  it "binds state to the OAuth client identity" do
    state = connection.start!
    allow(client).to receive(:identity).and_return(identity.merge("mode" => "live"))
    expect { connection.complete!(state:, browser_state: state, code: "synthetic_code") }.to raise_error(described_class::Error)
    expect(client).not_to have_received(:exchange)
    expect(provider.reload.settings).not_to have_key("oauth_state")
  end

  it "consumes a callback even when application configuration becomes unavailable" do
    state = connection.start!
    allow(PaymentProviders::RazorpayOauthClient).to receive(:new).and_raise(PaymentProviders::RazorpayOauthClient::Unavailable, "config")
    expect { described_class.new(provider:, actor:).complete!(state:, browser_state: state, code: "synthetic_code") }.to raise_error(described_class::Error)
    expect(provider.reload.settings).not_to have_key("oauth_state")
    expect(provider.settings["oauth_status"]).to eq("reconnect_required")
  end

  it "consumes denied consent without exchanging or accepting a replay" do
    state = connection.start!
    expect(connection.complete!(state:, browser_state: state, error: "access_denied")).to eq(:denied)
    expect(provider.reload.settings["oauth_status"]).to eq("disconnected")
    expect { connection.complete!(state:, browser_state: state, code: "synthetic_code") }.to raise_error(described_class::Error)
    expect(client).not_to have_received(:exchange)
  end

  it "commits consumption before HTTP and persists a sanitized failure" do
    state = connection.start!
    allow(client).to receive(:exchange) do
      expect(PaymentsProvider.find(provider.id).settings).not_to have_key("oauth_state")
      raise PaymentProviders::RazorpayOauthClient::Error, "synthetic secret provider body"
    end
    expect { connection.complete!(state:, browser_state: state, code: "synthetic_code") }.to raise_error(described_class::Error, "Razorpay account connection failed")
    expect(provider.reload.settings["oauth_status"]).to eq("reconnect_required")
    expect { connection.complete!(state:, browser_state: state, code: "synthetic_code") }.to raise_error(described_class::Error)
    expect(client).to have_received(:exchange).once
  end

  it "rejects replay after a successful callback" do
    state = connection.start!
    connection.complete!(state:, browser_state: state, code: "synthetic_code")
    expect { connection.complete!(state:, browser_state: state, code: "synthetic_code") }.to raise_error(described_class::Error)
    expect(client).to have_received(:exchange).once
  end

  it "allows a newer consent attempt before either code exchange begins" do
    state = connection.start!
    next_state = described_class.new(provider: PaymentsProvider.find(provider.id), actor:, client:).start!
    expect { connection.complete!(state:, browser_state: state, code: "synthetic_code") }.to raise_error(described_class::Error)
    expect(provider.reload.settings["oauth_status"]).to eq("pending")
    expect(provider.settings.dig("oauth_state", "digest")).to eq(Digest::SHA256.hexdigest(next_state))
    expect(provider.razorpay_oauth_credentials).to be_nil
    expect(connection.complete!(state: next_state, browser_state: next_state, code: "synthetic_code")).to eq(:connected)
  end

  it "does not let an in-flight callback undo a disconnect" do
    state = connection.start!
    allow(client).to receive(:exchange) do
      described_class.new(provider: PaymentsProvider.find(provider.id), actor:, client:).disconnect!
      tokens
    end
    expect { connection.complete!(state:, browser_state: state, code: "synthetic_code") }.to raise_error(described_class::Error)
    expect(provider.reload).not_to be_connected
    expect(provider.settings["oauth_status"]).to eq("reconnect_required")
    expect(client).to have_received(:revoke).with("synthetic_refresh").once
  end

  it "fails closed if the actor loses authority during the exchange" do
    allow(client).to receive(:exchange) do
      actor.remove_role(:admin, company)
      tokens
    end
    expect { complete }.to raise_error(described_class::Error)
    expect(provider.reload).not_to be_connected
    expect(provider.settings["oauth_status"]).to eq("reconnect_required")
    expect(provider.razorpay_oauth_credentials).to be_nil
  end

  it "fails closed if application identity changes during the exchange" do
    allow(client).to receive(:exchange) do
      allow(client).to receive(:identity).and_return(identity.merge("mode" => "live"))
      tokens
    end
    expect { complete }.to raise_error(described_class::Error)
    expect(provider.reload.settings["oauth_status"]).to eq("revocation_pending")
    expect(provider.razorpay_oauth_credentials).to include("refresh_token" => "synthetic_refresh", "identity" => identity)
  end

  it "persists reconnect_required when saving a successful exchange fails" do
    allow(provider).to receive(:save!).and_wrap_original do |original, *arguments|
      raise ActiveRecord::StatementInvalid, "synthetic database failure" if provider.connected?

      original.call(*arguments)
    end
    expect { complete }.to raise_error(described_class::Error, "Razorpay account connection failed")
    expect(provider.reload.settings["oauth_status"]).to eq("reconnect_required")
    expect(provider.razorpay_oauth_credentials).to be_nil
    expect(client).to have_received(:revoke).with("synthetic_refresh").once
  end

  it "retains the merchant binding across disconnect and forbids replacement" do
    complete
    connection.disconnect!
    expect(provider.reload.settings["oauth_account_id"]).to eq("acc_synthetic")
    allow(client).to receive(:exchange).and_return(tokens.merge("razorpay_account_id" => "acc_different", "refresh_token" => "wrong_merchant_refresh"))
    allow(client).to receive(:revoke).with("wrong_merchant_refresh").and_raise(PaymentProviders::RazorpayOauthClient::Error, "not confirmed")
    expect { complete }.to raise_error(described_class::Error)
    expect(provider.reload.settings["oauth_account_id"]).to eq("acc_synthetic")
    expect(provider).not_to be_connected
    expect(provider.razorpay_oauth_credentials).to include("refresh_token" => "wrong_merchant_refresh")
    expect(client).to have_received(:revoke).with("wrong_merchant_refresh").once
    expect { connection.start! }.to raise_error(described_class::Error)
  end

  it "allows reconnecting the same merchant" do
    complete
    connection.disconnect!
    expect(complete).to eq(:connected)
  end

  it "requires explicit disconnect before replacing existing OAuth credentials" do
    complete
    previous_settings = provider.reload.settings.deep_dup
    expect { connection.start! }.to raise_error(described_class::Error)
    expect(provider.reload.settings).to eq(previous_settings)
    expect(connection.access_token).to eq("synthetic_access")
    expect(client).to have_received(:exchange).once
    expect(client).not_to have_received(:revoke)

    expect(connection.disconnect!).to eq(remote_revocation_confirmed: true)
    expect(client).to have_received(:revoke).with("synthetic_refresh").once
  end

  it "rotates both tokens under a row lock once credentials become stale" do
    complete
    rotated = tokens.merge("access_token" => "rotated_access", "refresh_token" => "rotated_refresh")
    allow(client).to receive(:refresh).with("synthetic_refresh", account_id: "acc_synthetic").and_return(rotated)
    travel 1.hour do
      expect(connection.access_token).to eq("rotated_access")
      expect(described_class.new(provider: PaymentsProvider.find(provider.id), actor:, client:).access_token).to eq("rotated_access")
    end
    expect(client).to have_received(:refresh).once
    expect(provider.reload.razorpay_oauth_credentials["refresh_token"]).to eq("rotated_refresh")
  end

  it "fails closed and persists reconnect_required after a failed refresh" do
    complete
    allow(client).to receive(:refresh).and_raise(PaymentProviders::RazorpayOauthClient::Error, "provider secret")
    travel 1.hour do
      expect { connection.access_token }.to raise_error(described_class::Error, "Razorpay account connection failed")
    end
    expect(provider.reload).not_to be_connected
    expect(provider.settings["oauth_status"]).to eq("reconnect_required")
    expect(provider.razorpay_oauth_credentials).to include("refresh_token" => "synthetic_refresh")
    expect(provider.razorpay_oauth_credentials).not_to have_key("access_token")
  end

  it "fails closed on an ambiguous refresh response" do
    complete
    allow(client).to receive(:refresh).and_return(tokens.except("refresh_token"))
    travel 1.hour do
      expect { connection.access_token }.to raise_error(described_class::Error)
    end
    expect(provider.reload.razorpay_oauth_credentials).to include("refresh_token" => "synthetic_refresh")
  end

  it "persists reconnect_required when saving rotated credentials fails" do
    complete
    allow(client).to receive(:refresh).and_return(tokens.merge("refresh_token" => "rotated_after_save_failure"))
    allow(provider).to receive(:save!).and_wrap_original do |original, *arguments|
      rotated = provider.razorpay_oauth_credentials&.dig("refresh_token") == "rotated_after_save_failure"
      raise ActiveRecord::StatementInvalid, "synthetic database failure" if provider.connected? && rotated

      original.call(*arguments)
    end
    travel 1.hour do
      expect { connection.access_token }.to raise_error(described_class::Error, "Razorpay account connection failed")
    end
    expect(provider.reload.settings["oauth_status"]).to eq("reconnect_required")
    expect(provider.razorpay_oauth_credentials).to be_nil
    expect(client).to have_received(:revoke).with("rotated_after_save_failure").once
  end

  it "refuses a stored token under another application without destroying the connection" do
    complete
    allow(client).to receive(:identity).and_return(identity.merge("client_id" => "different_app"))
    expect { connection.access_token }.to raise_error(described_class::Error)
    expect(provider.reload).to be_connected
    expect(provider.settings["oauth_status"]).to eq("connected")
    allow(client).to receive(:identity).and_return(identity)
    expect(connection.access_token).to eq("synthetic_access")
  end

  it "keeps expired credentials recoverable when application configuration is restored" do
    complete
    travel 1.hour do
      allow(client).to receive(:identity).and_return(identity.merge("client_id" => "different_app"))
      expect { connection.access_token }.to raise_error(described_class::Error)
      expect(provider.reload.settings["oauth_refresh_reservation"]).to be_nil
      expect(client).not_to have_received(:refresh)

      allow(client).to receive(:identity).and_return(identity)
      expect(connection.access_token).to eq("synthetic_access")
    end
    expect(provider.reload).to be_connected
    expect(client).to have_received(:refresh).once
  end

  it "keeps stored tokens usable and revocable when only the callback URL changes" do
    stub_razorpay_oauth_env
    complete
    allow(client).to receive(:identity).and_return(identity.merge("redirect_uri" => "https://next.example/payments/razorpay/callback"))

    expect(connection.access_token).to eq("synthetic_access")
    expect(connection.collections_ready?).to be(true)
    travel 1.hour do
      expect(connection.access_token).to eq("synthetic_access")
    end
    expect(client).to have_received(:refresh).once
    expect(connection.disconnect!).to eq(remote_revocation_confirmed: true)
    expect(client).to have_received(:revoke).with("synthetic_refresh").once
  end

  it "still rejects a changed callback during consent and revokes the returned grant" do
    state = connection.start!
    allow(client).to receive(:exchange) do
      allow(client).to receive(:identity).and_return(identity.merge("redirect_uri" => "https://next.example/payments/razorpay/callback"))
      tokens
    end

    expect { connection.complete!(state:, browser_state: state, code: "synthetic_code") }.to raise_error(described_class::Error)
    expect(provider.reload).not_to be_connected
    expect(client).to have_received(:revoke).with("synthetic_refresh").once
    expect(provider.razorpay_oauth_credentials).to be_nil
  end

  it "retains the rotated cleanup token when identity changes after refresh" do
    complete
    allow(client).to receive(:refresh) do
      allow(client).to receive(:identity).and_return(identity.merge("client_id" => "different_app"))
      tokens.merge("refresh_token" => "rotated_cleanup")
    end
    travel 1.hour do
      expect { connection.access_token }.to raise_error(described_class::Error)
    end
    expect(provider.reload.razorpay_oauth_credentials).to include("refresh_token" => "rotated_cleanup", "identity" => identity)
    expect(provider.razorpay_oauth_credentials).not_to have_key("access_token")
    expect(client).not_to have_received(:revoke)
    allow(client).to receive(:identity).and_return(identity)
    expect { connection.start! }.to raise_error(described_class::Error)
    expect(connection.disconnect!).to eq(remote_revocation_confirmed: true)
    expect(client).to have_received(:revoke).with("rotated_cleanup").once
  end

  it "disconnects locally even when revocation fails, preserving account and other settings" do
    complete
    allow(client).to receive(:revoke).and_raise(PaymentProviders::RazorpayOauthClient::Error, "provider secret")
    expect(connection.disconnect!).to eq(remote_revocation_confirmed: false)
    expect(provider.reload).not_to be_connected
    expect(provider).not_to be_enabled
    expect(provider.razorpay_oauth_credentials).to include("refresh_token" => "synthetic_refresh")
    expect(provider.settings["oauth_account_id"]).to eq("acc_synthetic")
    expect(provider.platform_fee_percent).to eq("0.0")
  end

  it "disconnects locally when application configuration is unavailable" do
    complete
    allow(PaymentProviders::RazorpayOauthClient).to receive(:new).and_raise(PaymentProviders::RazorpayOauthClient::Unavailable, "config")
    expect(described_class.new(provider:, actor:).disconnect!).to eq(remote_revocation_confirmed: false)
    expect(provider.reload.razorpay_oauth_credentials).to include("refresh_token" => "synthetic_refresh")
  end

  [0, 120].each do |reservation_age|
    it "requires reconciliation when disconnecting a #{reservation_age}-second-old refresh reservation" do
      complete
      provider.update!(settings: provider.settings.merge("oauth_refresh_reservation" => "interrupted-worker",
        "oauth_refresh_reserved_at" => reservation_age.seconds.ago.to_i))

      expect(connection.disconnect!).to eq(remote_revocation_confirmed: false)
      expect(provider.reload.settings["oauth_refresh_reservation"]).to be_nil
      expect(connection.status[:status]).to eq("reconciliation_required")
      expect(connection.status[:recovery_available]).to be(true)
      expect { connection.start! }.to raise_error(described_class::Error)
    end
  end

  it "clears an interrupted refresh after signed revocation without poisoning a later connection" do
    complete
    provider.update!(settings: provider.settings.merge("oauth_refresh_reservation" => "interrupted-worker",
      "oauth_refresh_reserved_at" => 2.minutes.ago.to_i))

    expect(connection.provider_revoked!(occurred_at: Time.current.to_i, event_id: "evt_revocation")).to eq(:revoked)
    expect(provider.reload.settings["oauth_refresh_reservation"]).to be_nil
    expect(connection.status[:status]).to eq("revoked")
    expect(complete).to eq(:connected)
    travel 1.hour do
      expect(connection.access_token).to eq("synthetic_access")
    end
    expect(client).to have_received(:refresh).once
    expect(provider.reload).to be_connected
  end

  it "does not let a revocation from before an interrupted refresh clear reconciliation" do
    complete
    previous_revocation_at = Time.current.to_i + 60
    travel 2.hours do
      provider.update!(settings: provider.settings.merge("oauth_refresh_reservation" => "interrupted-worker",
        "oauth_refresh_reserved_at" => Time.current.to_i))
      expect(connection.disconnect!).to eq(remote_revocation_confirmed: false)

      expect(connection.provider_revoked!(occurred_at: previous_revocation_at, event_id: "evt_previous_grant")).to eq(:ignored)
      expect(connection.status[:status]).to eq("reconciliation_required")
      expect(connection.provider_revoked!(occurred_at: Time.current.to_i, event_id: "evt_current_grant")).to eq(:revoked)
      expect(connection.status[:status]).to eq("revoked")
    end
  end

  it "requires a recovery start time to reconcile an older uncertainty marker" do
    complete
    earlier_event_at = Time.current.to_i + 60
    travel 2.hours do
      provider.update!(connected: false, settings: provider.settings.merge("oauth_refresh_uncertain" => true,
        "oauth_status" => "reconnect_required"))

      expect(connection.provider_revoked!(occurred_at: earlier_event_at, event_id: "evt_legacy_old")).to eq(:ignored)
      connection.request_recovery!(account_id: "acc_synthetic")
      expect(connection.provider_revoked!(occurred_at: Time.current.to_i, event_id: "evt_legacy_current")).to eq(:revoked)
      expect(connection.status[:status]).to eq("revoked")
    end
  end

  it "keeps an orphaned reservation blocked but recoverable without a cleanup token" do
    complete
    provider.update!(connected: false, settings: provider.settings.except("razorpay_oauth_credentials_ciphertext").merge(
      "oauth_refresh_reservation" => "interrupted-worker", "oauth_refresh_reserved_at" => 2.minutes.ago.to_i,
      "oauth_status" => "disconnected"))

    expect(provider.razorpay_oauth_in_use?).to be(true)
    expect(connection.status[:status]).to eq("reconciliation_required")
    expect { connection.start! }.to raise_error(described_class::Error)
    connection.request_recovery!(account_id: "acc_synthetic")
    connection.finish_recovery_with_evidence!(provider_reference: "support-123")
    expect(provider.reload.settings["oauth_refresh_reservation"]).to be_nil
    expect(connection.status[:status]).to eq("reconnect_required")
    expect(connection.start!).to match(/\A[0-9a-f]{64}\z/)
  end

  it "review regression: retains encrypted revocation material and retries before reconnecting" do
    complete
    allow(client).to receive(:revoke).and_raise(PaymentProviders::RazorpayOauthClient::Error, "not confirmed")
    expect(connection.disconnect!).to eq(remote_revocation_confirmed: false)
    expect(provider.reload.razorpay_oauth_credentials).to include("refresh_token" => "synthetic_refresh", "identity" => identity)
    expect(provider.razorpay_oauth_credentials).not_to have_key("access_token")
    expect(provider.settings.to_json).not_to include("synthetic_refresh")
    expect { connection.access_token }.to raise_error(described_class::Error)
    expect { connection.start! }.to raise_error(described_class::Error)
    allow(client).to receive(:revoke).and_return(true)
    expect(connection.disconnect!).to eq(remote_revocation_confirmed: true)
    expect(provider.reload.razorpay_oauth_credentials).to be_nil
    expect(connection.start!).to match(/\A[0-9a-f]{64}\z/)
  end

  it "review regression: configuration failures preserve material for later revocation" do
    complete
    allow(PaymentProviders::RazorpayOauthClient).to receive(:new).and_raise(PaymentProviders::RazorpayOauthClient::Unavailable, "config")
    unavailable = described_class.new(provider:, actor:)
    expect { unavailable.access_token }.to raise_error(described_class::Error)
    expect(provider.reload.razorpay_oauth_credentials).to include("refresh_token" => "synthetic_refresh")
    expect(unavailable.disconnect!).to eq(remote_revocation_confirmed: false)
    expect(provider.reload.razorpay_oauth_credentials).to include("refresh_token" => "synthetic_refresh")
    expect(connection.disconnect!).to eq(remote_revocation_confirmed: true)
  end

  it "requires provider reconciliation after an ambiguous exchange without a cleanup token" do
    state = connection.start!
    allow(client).to receive(:exchange).and_raise(PaymentProviders::RazorpayOauthClient::Error, "uncertain response")
    expect { connection.complete!(state:, browser_state: state, code: "synthetic_code") }.to raise_error(described_class::Error)
    expect(connection.status[:status]).to eq("reconciliation_required")
    expect(connection.disconnect!).to eq(remote_revocation_confirmed: false)
    expect(connection.status[:status]).to eq("reconciliation_required")
    expect { connection.start! }.to raise_error(described_class::Error)
    expect(client).not_to have_received(:revoke)
    expect(provider.reload.razorpay_oauth_credentials).to be_nil
  end

  it "review regression: rejected grants retain cleanup tokens when revocation fails" do
    state = connection.start!
    allow(client).to receive(:exchange) do
      actor.remove_role(:admin, company)
      tokens
    end
    allow(client).to receive(:revoke).and_raise(PaymentProviders::RazorpayOauthClient::Error, "not confirmed")
    expect { connection.complete!(state:, browser_state: state, code: "synthetic_code") }.to raise_error(described_class::Error)
    expect(provider.reload.razorpay_oauth_credentials).to include("refresh_token" => "synthetic_refresh")
    expect(provider).not_to be_connected
    actor.add_role(:admin, company)
    expect { connection.start! }.to raise_error(described_class::Error)
    allow(client).to receive(:revoke).and_return(true)
    expect(connection.disconnect!).to eq(remote_revocation_confirmed: true)
    expect(provider.reload.razorpay_oauth_credentials).to be_nil
  end

  it "review regression: an in-flight exchange blocks new consent and cleans up a disconnected callback" do
    state = connection.start!
    allow(client).to receive(:exchange) do
      expect { described_class.new(provider: PaymentsProvider.find(provider.id), actor:, client:).start! }.to raise_error(described_class::Error)
      described_class.new(provider: PaymentsProvider.find(provider.id), actor:, client:).disconnect!
      expect { described_class.new(provider: PaymentsProvider.find(provider.id), actor:, client:).start! }.to raise_error(described_class::Error)
      tokens
    end
    expect { connection.complete!(state:, browser_state: state, code: "synthetic_code") }.to raise_error(described_class::Error)
    expect(client).to have_received(:revoke).with("synthetic_refresh").once
    expect(provider.reload.razorpay_oauth_credentials).to be_nil
    expect(connection.start!).to match(/\A[0-9a-f]{64}\z/)
  end

  it "clears stale collection and payout flags when disconnecting an OAuth provider" do
    complete
    provider.update!(enabled_on_invoices: true, payouts_enabled: true,
      payout_account_number: "synthetic-account", payout_upi_id: "synthetic@upi")
    connection.disconnect!
    expect(provider.reload).not_to be_enabled_on_invoices
    expect(provider).not_to be_payouts_enabled
    expect(provider.payout_account_number).to eq("synthetic-account")
  end

  context "through the real OAuth client" do
    let(:client) { PaymentProviders::RazorpayOauthClient.new }
    let(:wire_tokens) { tokens.merge("token_type" => "Bearer") }

    before do
      allow(ENV).to receive(:[]).and_call_original
      { "ENABLED" => "true", "CLIENT_ID" => identity["client_id"], "CLIENT_SECRET" => "synthetic_secret",
        "REDIRECT_URI" => identity["redirect_uri"], "MODE" => identity["mode"] }.each do |key, value|
        allow(ENV).to receive(:[]).with("RAZORPAY_OAUTH_#{key}").and_return(value)
      end
      stub_request(:post, "https://auth.razorpay.com/token").to_return(status: 200, body: wire_tokens.to_json)
      stub_request(:post, "https://auth.razorpay.com/revoke").to_return(status: 503, body: "unconfirmed")
    end

    { merchant: { "razorpay_account_id" => "invalid_merchant" }, expiry: { "expires_in" => 0 },
      public_token: { "public_token" => "rzp_live_oauth_wrong" } }.each do |invalid, fields|
      %i[exchange refresh].each do |operation|
        it "retains returned cleanup after #{operation} rejects #{invalid}" do
          complete if operation == :refresh
          response_fields = operation == :refresh && invalid == :merchant ? { "razorpay_account_id" => "acc_other" } : fields
          stub_request(:post, "https://auth.razorpay.com/token").to_return(status: 200,
            body: wire_tokens.merge(response_fields).merge("refresh_token" => "returned_cleanup").to_json)
          if operation == :refresh
            travel 1.hour do
              expect { connection.access_token }.to raise_error(described_class::Error)
            end
          else
            expect { complete }.to raise_error(described_class::Error)
          end
          expect(provider.reload.razorpay_oauth_credentials).to eq("refresh_token" => "returned_cleanup", "identity" => identity)
          expect(provider.settings.to_json).not_to include("returned_cleanup", "synthetic_access")
          expect(connection.status[:status]).to eq("revocation_pending")
          expect { connection.start! }.to raise_error(described_class::Error)
          expect(a_request(:post, "https://auth.razorpay.com/revoke").with { |request| JSON.parse(request.body)["token"] == "returned_cleanup" }).to have_been_made.once
        end
      end
    end

    %i[exchange refresh].each do |operation|
      it "requires reconciliation after an unparseable #{operation} response" do
        complete if operation == :refresh
        stub_request(:post, "https://auth.razorpay.com/token").to_return(status: 200, body: "not-json")
        if operation == :refresh
          travel 1.hour do
            expect { connection.access_token }.to raise_error(described_class::Error)
          end
        else
          expect { complete }.to raise_error(described_class::Error)
        end
        expect(connection.status[:status]).to eq("reconciliation_required")
        expect { connection.start! }.to raise_error(described_class::Error)
        expect(WebMock).not_to have_requested(:post, "https://auth.razorpay.com/revoke")
        if operation == :refresh
          stub_request(:post, "https://auth.razorpay.com/revoke").to_return(status: 200, body: { message: "Token Revoked" }.to_json)
          expect(connection.disconnect!).to eq(remote_revocation_confirmed: false)
          expect(connection.status[:status]).to eq("reconciliation_required")
          expect { connection.start! }.to raise_error(described_class::Error)
        end
      end
    end
  end
end

RSpec.describe PaymentProviders::RazorpayOauthConnection, "concurrent operations" do
  let(:company) { create(:company) }
  let(:actor) { create(:user, current_workspace: company) }
  let(:provider) { create(:payments_provider, company:, name: "razorpay", settings: { platform_fee_percent: "0" }) }
  let(:identity) { { "client_id" => "synthetic_app", "mode" => "test", "redirect_uri" => "http://127.0.0.1:3000/payments/razorpay/callback" } }
  let(:tokens) do
    { "access_token" => "synthetic_access", "refresh_token" => "synthetic_refresh", "public_token" => "rzp_test_oauth_synthetic",
      "expires_in" => 3600, "razorpay_account_id" => "acc_synthetic" }
  end
  let(:client) { instance_double(PaymentProviders::RazorpayOauthClient, identity:, exchange: tokens, refresh: tokens, revoke: true) }

  around do |example|
    VCR.turned_off do
      WebMock.disable_net_connect!
      example.run
    end
  end

  prepend_before do
    stub_request(:get, %r{\Ahttps://api\.pwnedpasswords\.com/range/}).to_return(status: 200, body: "")
  end

  before do
    # Threads need committed fixtures so separate database connections can see them.
    DatabaseCleaner.clean
    DatabaseCleaner.strategy = :deletion, { except: %w[ar_internal_metadata schema_migrations] }
    create(:employment, company:, user: actor, resigned_at: nil)
    actor.add_role(:admin, company)
    connection = described_class.new(provider:, actor:, client:)
    state = connection.start!
    connection.complete!(state:, browser_state: state, code: "synthetic_code")
    @threads = []
  end

  after do
    @threads.each { |thread| thread.kill if thread.alive? }
    @threads.each(&:join)
  end

  def operation_in_thread(label, &operation)
    provider_id, actor_id = provider.id, actor.id
    @threads << Thread.new do
      Thread.current.report_on_exception = false
      ActiveRecord::Base.connection_pool.with_connection do |database|
        database.execute("SELECT set_config('application_name', #{database.quote(label)}, false)")
        connection = described_class.new(provider: PaymentsProvider.find(provider_id), actor: User.find(actor_id), client:)
        operation.call(connection)
      ensure
        database.execute("RESET application_name")
      end
    end
    @threads.last
  end

  def wait_for_row_lock(label)
    Timeout.timeout(5) do
      loop do
        waiting = ActiveRecord::Base.connection.select_value(
          "SELECT EXISTS(SELECT 1 FROM pg_stat_activity WHERE application_name = #{ActiveRecord::Base.connection.quote(label)} AND wait_event_type = 'Lock')")
        break if waiting

        Thread.pass
      end
    end
  end

  it "makes one refresh request when stale callers compete for the provider" do
    entered, release = Queue.new, Queue.new
    allow(client).to receive(:refresh) do
      entered << true
      release.pop
      tokens.merge("access_token" => "rotated_access", "refresh_token" => "rotated_refresh")
    end
    travel 1.hour do
      first = operation_in_thread("miru_oauth_refresh_first", &:access_token)
      Timeout.timeout(5) { entered.pop }
      second = operation_in_thread("miru_oauth_refresh_second", &:access_token)
      wait_for_row_lock("miru_oauth_refresh_second")
      release << true
      expect(Timeout.timeout(5) { [first.value, second.value] }).to eq(%w[rotated_access rotated_access])
    end
    expect(client).to have_received(:refresh).once
    expect(provider.reload.razorpay_oauth_credentials["refresh_token"]).to eq("rotated_refresh")
  ensure
    release << true
  end

  it "finishes revocation before a concurrent consent attempt can start" do
    entered, release = Queue.new, Queue.new
    allow(client).to receive(:revoke) do
      entered << true
      release.pop
      true
    end
    first = operation_in_thread("miru_oauth_disconnect", &:disconnect!)
    Timeout.timeout(5) { entered.pop }
    second = operation_in_thread("miru_oauth_restart", &:start!)
    wait_for_row_lock("miru_oauth_restart")
    release << true
    expect(Timeout.timeout(5) { first.value }).to eq(remote_revocation_confirmed: true)
    expect(Timeout.timeout(5) { second.value }).to match(/\A[0-9a-f]{64}\z/)
    expect(provider.reload.settings["oauth_status"]).to eq("pending")
    expect(provider.razorpay_oauth_credentials).to be_nil
    expect(provider.settings["oauth_account_id"]).to eq("acc_synthetic")
  ensure
    release << true
  end

  it "commits disabled state and cleanup material before attempting remote revocation" do
    provider_id = provider.id
    allow(client).to receive(:revoke) do
      snapshot = Thread.new do
        ActiveRecord::Base.connection_pool.with_connection do
          stored = PaymentsProvider.find(provider_id)
          [stored.connected?, stored.razorpay_oauth_credentials]
        end
      end.value
      expect(snapshot.first).to be(false)
      expect(snapshot.last).to include("refresh_token" => "synthetic_refresh")
      expect(snapshot.last).not_to have_key("access_token")
      true
    end
    connection = described_class.new(provider:, actor:, client:)
    expect(connection.disconnect!).to eq(remote_revocation_confirmed: true)
  end

  it "finishes rejected callback cleanup before a newer grant can start" do
    connection = described_class.new(provider:, actor:, client:)
    connection.disconnect!
    state = connection.start!
    exchanged, exchange_release, revoking, revoke_release = Array.new(4) { Queue.new }
    allow(client).to receive(:exchange) do
      exchanged << true
      exchange_release.pop
      tokens.merge("refresh_token" => "rejected_refresh")
    end
    allow(client).to receive(:revoke).with("rejected_refresh") do
      revoking << true
      revoke_release.pop
      true
    end
    callback = operation_in_thread("miru_oauth_rejected_callback") do |attempt|
      attempt.complete!(state:, browser_state: state, code: "synthetic_code")
    rescue described_class::Error
      :rejected
    end
    Timeout.timeout(5) { exchanged.pop }
    connection.disconnect!
    expect(connection.status[:status]).to eq("reconciliation_required")
    expect { connection.start! }.to raise_error(described_class::Error)
    exchange_release << true
    Timeout.timeout(5) { revoking.pop }
    newer = operation_in_thread("miru_oauth_after_rejected_cleanup", &:start!)
    wait_for_row_lock("miru_oauth_after_rejected_cleanup")
    revoke_release << true
    expect(Timeout.timeout(5) { callback.value }).to eq(:rejected)
    expect(Timeout.timeout(5) { newer.value }).to match(/\A[0-9a-f]{64}\z/)
    expect(provider.reload.settings["oauth_status"]).to eq("pending")
    expect(provider.razorpay_oauth_credentials).to be_nil
    expect(client).to have_received(:revoke).with("rejected_refresh").once
  ensure
    exchange_release << true
    revoke_release << true
  end

  it "retains rotated cleanup ownership across an actual SQL save failure and concurrent disconnect" do
    record = PaymentsProvider.find(provider.id)
    attempt = described_class.new(provider: record, actor:, client:)
    recovery_entered, recovery_release = Queue.new, Queue.new
    failed_save = paused = false
    allow(client).to receive(:refresh).and_return(tokens.merge("refresh_token" => "rotated_during_failure"))
    allow(record).to receive(:save!).and_wrap_original do |original, *arguments|
      if !failed_save && record.razorpay_oauth_credentials["refresh_token"] == "rotated_during_failure"
        failed_save = true
        record.class.connection.execute("SELECT 1 / 0")
      end
      original.call(*arguments)
    end
    allow(record).to receive(:reload).and_wrap_original do |original, *arguments, **keywords|
      if failed_save && !paused
        paused = true
        recovery_entered << true
        recovery_release.pop
      end
      original.call(*arguments, **keywords)
    end
    travel 1.hour do
      refreshing = Thread.new do
        Thread.current.report_on_exception = false
        ActiveRecord::Base.connection_pool.with_connection { attempt.access_token }
      rescue described_class::Error
        :failed
      end
      @threads << refreshing
      Timeout.timeout(5) { recovery_entered.pop }
      disconnecting = operation_in_thread("miru_oauth_disconnect_during_recovery", &:disconnect!)
      waiting = Timeout.timeout(5) do
        loop do
          break true if ActiveRecord::Base.connection.select_value(
            "SELECT EXISTS(SELECT 1 FROM pg_stat_activity WHERE application_name = 'miru_oauth_disconnect_during_recovery' AND wait_event_type = 'Lock')")
          break false unless disconnecting.alive?

          Thread.pass
        end
      end
      recovery_release << true
      expect(Timeout.timeout(5) { refreshing.value }).to eq(:failed)
      Timeout.timeout(5) { disconnecting.value }
      expect(waiting).to be(true)
    end
    expect(client).to have_received(:revoke).with("rotated_during_failure").once
    expect(provider.reload).not_to be_connected
    expect(provider.razorpay_oauth_credentials).to be_nil
  ensure
    recovery_release << true
  end
end
