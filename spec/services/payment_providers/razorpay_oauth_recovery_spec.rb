# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Razorpay OAuth failure classification and recovery" do
  before do
    # Refresh intent must be tested with real commits, not a surrounding example transaction.
    DatabaseCleaner.clean
    DatabaseCleaner.strategy = :deletion, { except: %w[ar_internal_metadata schema_migrations] }
  end

  let(:company) { create(:company) }
  let(:actor) { create(:user, current_workspace: company) }
  let!(:employment) { create(:employment, user: actor, company:, resigned_at: nil) }
  let(:provider) { create(:payments_provider, company:, name: "razorpay", settings: { platform_fee_percent: "0" }) }
  let(:connection) { PaymentProviders::RazorpayOauthConnection.new(provider:, actor:) }
  let(:client) { PaymentProviders::RazorpayOauthClient.new }

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
    actor.add_role(:admin, company)
    stub_razorpay_oauth_env
  end

  def attempt_exchange
    state = connection.start!
    expect { connection.complete!(state:, browser_state: state, code: "synthetic-code") }
      .to raise_error(PaymentProviders::RazorpayOauthConnection::Error)
    provider.reload
  end

  describe "the documented contract" do
    PaymentProviders::RazorpayOauthClient::EXCHANGE_REJECTIONS.each do |description|
      it "treats the exact token error #{description.inspect} as definitive" do
        stub_razorpay_token(body: razorpay_rejection(description), status: 400)
        expect { client.exchange("synthetic-code") }.to raise_error(PaymentProviders::RazorpayOauthClient::Rejected)
      end
    end

    [
      ["blanket 4xx with no description", 400, {}],
      ["a substring of a documented error", 400, { error: { description: "Authorization code has expired, retry" } }],
      ["different letter case", 400, { error: { description: "authorization code has expired" } }],
      ["a documented error on a 5xx", 500, { error: { description: "Authorization code has expired" } }],
      ["a documented error on a rate limit", 429, { error: { description: "Authorization code has expired" } }],
      ["a documented error on a timeout status", 408, { error: { description: "Authorization code has expired" } }],
      ["a code that may reflect an earlier exchange", 400, { error: { description: "Authorization code has been revoked" } }],
      ["a refresh-only error during exchange", 400, { error: { description: "Token has been revoked" } }],
      ["an array error body", 400, ["Authorization code has expired"]]
    ].each do |label, status, body|
      it "keeps #{label} ambiguous" do
        stub_razorpay_token(body:, status:)
        expect { client.exchange("synthetic-code") }.to raise_error(PaymentProviders::RazorpayOauthClient::Error) { |error|
          expect(error).not_to be_a(PaymentProviders::RazorpayOauthClient::Rejected)
        }
      end
    end

    it "keeps an unparseable 4xx ambiguous" do
      stub_razorpay_token(body: "<html>Authorization code has expired</html>", status: 400)
      expect { client.exchange("synthetic-code") }.to raise_error(PaymentProviders::RazorpayOauthClient::Error) { |error|
        expect(error).not_to be_a(PaymentProviders::RazorpayOauthClient::Rejected)
      }
    end

    it "accepts already-invalid revocation as idempotent and rejects a server error" do
      stub_request(:post, RazorpayOauthHelpers::REVOKE_URL)
        .to_return({ status: 400, body: razorpay_rejection("Could not validate the token provided").to_json },
          { status: 500, body: { error: { code: "SERVER_ERROR", description: "The server encountered an error. The incident has been reported to admins" } }.to_json })
      expect(client.revoke("synthetic-refresh")).to be(true)
      expect { client.revoke("synthetic-refresh") }.to raise_error(PaymentProviders::RazorpayOauthClient::Error)
    end
  end

  describe "failed authorization" do
    it "allows reconnect after a definitive exchange rejection" do
      stub_razorpay_token(body: razorpay_rejection("Authorization code has expired"), status: 400)
      attempt_exchange
      expect(razorpay_oauth_status(provider)).to include(status: "reconnect_required")
      expect(provider.settings).not_to have_key("oauth_pending_digest")
      expect(connection.start!).to match(/\A[0-9a-f]{64}\z/)
    end

    [
      ["a transport failure", -> { stub_request(:post, RazorpayOauthHelpers::TOKEN_URL).to_timeout }],
      ["a provider 5xx", -> { stub_razorpay_token(body: {}, status: 503) }],
      ["a malformed 2xx", -> { stub_razorpay_token(body: "not json") }]
    ].each do |label, failure|
      it "fails closed and blocks reconnect after #{label}" do
        instance_exec(&failure)
        attempt_exchange
        expect(razorpay_oauth_status(provider)).to include(status: "reconciliation_required", collections_ready: false)
        expect { connection.start! }.to raise_error(PaymentProviders::RazorpayOauthConnection::Error)
      end
    end

    it "keeps merchant rejection distinct and restartable without an exchange" do
      state = connection.start!
      expect(connection.complete!(state:, browser_state: state, error: "merchant_rejected")).to eq(:merchant_rejected)
      expect(WebMock).not_to have_requested(:post, RazorpayOauthHelpers::TOKEN_URL)
      expect(razorpay_oauth_status(provider)).to include(status: "merchant_rejected")
      expect(connection.start!).to be_present
    end
  end

  describe "refresh failures" do
    before { connect_razorpay_oauth(provider, actor) }

    def refresh_after_expiry
      travel 2.hours do
        expect { connection.access_token }.to raise_error(PaymentProviders::RazorpayOauthConnection::Error)
      end
      provider.reload
    end

    PaymentProviders::RazorpayOauthClient::INVALID_REFRESH_TOKEN.each do |description|
      it "drops a token Razorpay reports as #{description.inspect} and allows reconnect" do
        stub_razorpay_token(body: razorpay_rejection(description), status: 400)
        refresh_after_expiry
        expect(provider.settings).not_to have_key("razorpay_oauth_credentials_ciphertext")
        expect(razorpay_oauth_status(provider)).to include(status: "reconnect_required")
        expect(connection.start!).to be_present
      end
    end

    it "keeps cleanup material without an unknown-grant marker when the application was rejected" do
      stub_razorpay_token(body: razorpay_rejection("Access denied"), status: 401)
      refresh_after_expiry
      expect(provider.razorpay_oauth_credentials).to include("refresh_token" => "synthetic-refresh")
      expect(provider.settings).not_to have_key("oauth_refresh_uncertain")
      expect(razorpay_oauth_status(provider)).to include(status: "revocation_pending")
    end

    it "marks the grant unknown after an ambiguous refresh" do
      stub_razorpay_token(body: {}, status: 502)
      refresh_after_expiry
      expect(razorpay_oauth_status(provider)).to include(status: "reconciliation_required")
    end

    it "retries known revocation idempotently until it is resolved" do
      revoke = stub_request(:post, RazorpayOauthHelpers::REVOKE_URL)
        .to_return({ status: 503, body: "" }, { status: 400, body: razorpay_rejection("Could not validate the token provided").to_json })
      expect(connection.disconnect!).to eq(remote_revocation_confirmed: false)
      expect(razorpay_oauth_status(provider)).to include(status: "revocation_pending")
      expect(connection.disconnect!).to eq(remote_revocation_confirmed: true)
      expect(revoke).to have_been_requested.twice
      expect(provider.reload.settings).not_to have_key("razorpay_oauth_credentials_ciphertext")
      expect(connection.start!).to be_present
    end
  end

  describe "owner recovery of an unknown grant" do
    before do
      stub_request(:post, RazorpayOauthHelpers::TOKEN_URL).to_timeout
      attempt_exchange
    end

    it "does not clear the marker through disconnect or a blank request" do
      connection.disconnect!
      expect(razorpay_oauth_status(provider)).to include(status: "reconciliation_required")
      expect { connection.request_recovery!(account_id: "") }.to raise_error(PaymentProviders::RazorpayOauthConnection::Error, /starts with acc_/)
      expect { connection.finish_recovery_with_evidence!(provider_reference: "RZP-12345") }
        .to raise_error(PaymentProviders::RazorpayOauthConnection::Error, /recovery first/)
      expect(razorpay_oauth_status(provider)).to include(status: "reconciliation_required")
    end

    it "stays blocked until signed evidence arrives, then only audits identifiers" do
      connection.request_recovery!(account_id: "acc_recovery")
      expect(razorpay_oauth_status(provider)).to include(status: "recovery_pending", account_id: "acc_recovery")
      expect { connection.start! }.to raise_error(PaymentProviders::RazorpayOauthConnection::Error)
      expect(PaymentProviders::RazorpayOauthConnection.new(provider: provider.reload, actor: nil).provider_revoked!(occurred_at: 1.hour.ago.to_i, event_id: "evt_old")).to eq(:ignored)
      expect(razorpay_oauth_status(provider)).to include(status: "recovery_pending")

      result = PaymentProviders::RazorpayOauthConnection.new(provider: provider.reload, actor: nil).provider_revoked!(occurred_at: 1.minute.from_now.to_i, event_id: "evt_new")
      expect(result).to eq(:revoked)
      expect(razorpay_oauth_status(provider)).to include(status: "revoked")
      expect(connection.start!).to be_present
      audits = Audited::Audit.where(auditable: provider)
      expect(audits.pluck(:action)).to include("razorpay_oauth_recovery_requested", "razorpay_oauth_provider_revoked")
      expect(audits.map { |audit| audit.audited_changes.to_json }.join).not_to include("synthetic-access", "synthetic-refresh", "synthetic-secret", "synthetic-code")
    end

    it "accepts only a well-formed provider reference and records it" do
      connection.request_recovery!(account_id: "acc_recovery")
      ["", "x", "bad reference", "<script>", nil, ["RZP-1"]].each do |reference|
        expect { connection.finish_recovery_with_evidence!(provider_reference: reference) }
          .to raise_error(PaymentProviders::RazorpayOauthConnection::Error, /support reference/)
      end
      connection.finish_recovery_with_evidence!(provider_reference: "RZP-12345")
      expect(razorpay_oauth_status(provider)).to include(status: "reconnect_required")
      expect(Audited::Audit.where(auditable: provider, action: "razorpay_oauth_recovery_attested").last.audited_changes)
        .to include("account_id" => "acc_recovery", "provider_reference" => "RZP-12345")
    end

    it "requires known cleanup to be resolved before evidence is accepted" do
      provider.reload.razorpay_oauth_credentials = { "refresh_token" => "synthetic-refresh", "identity" => client.identity }
      provider.save!
      connection.request_recovery!(account_id: "acc_recovery")
      expect { connection.finish_recovery_with_evidence!(provider_reference: "RZP-12345") }
        .to raise_error(PaymentProviders::RazorpayOauthConnection::Error, /known grant/)
    end

    it "binds recovery to the connected merchant when it is known" do
      provider.reload.settings["oauth_account_id"] = "acc_known"
      provider.save!
      expect { connection.request_recovery!(account_id: "acc_other") }
        .to raise_error(PaymentProviders::RazorpayOauthConnection::Error, /connected to this workspace/)
      connection.request_recovery!(account_id: "acc_known")
      expect(razorpay_oauth_status(provider)).to include(account_id: "acc_known")
    end

    it "denies recovery to anyone who cannot manage the workspace" do
      actor.remove_role(:admin, company)
      actor.add_role(:employee, company)
      expect { connection.request_recovery!(account_id: "acc_recovery") }
        .to raise_error(PaymentProviders::RazorpayOauthConnection::Error, /access denied/)
    end
  end

  describe "when the application changes after connecting" do
    before do
      connect_razorpay_oauth(provider, actor)
      stub_razorpay_oauth_env(CLIENT_ID: "production-client")
    end

    it "offers recovery instead of an endless retry, then allows a clean reconnect" do
      expect(connection.disconnect!).to eq(remote_revocation_confirmed: false)
      expect(WebMock).not_to have_requested(:post, RazorpayOauthHelpers::REVOKE_URL)
      expect(razorpay_oauth_status(provider)).to include(status: "revocation_pending", recovery_available: true, cleanup_pending: true)

      connection.request_recovery!(account_id: "")
      expect(razorpay_oauth_status(provider)).to include(status: "recovery_pending", account_id: "acc_synthetic")
      connection.finish_recovery_with_evidence!(provider_reference: "RZP-12345")
      expect(razorpay_oauth_status(provider)).to include(status: "reconnect_required", cleanup_pending: false)
      expect(Audited::Audit.where(auditable: provider, action: "razorpay_oauth_recovery_attested").last.audited_changes)
        .to include("discarded_other_application_token" => true)
      expect(connection.start!).to be_present
    end

    it "revokes normally if the original application comes back" do
      connection.disconnect!
      stub_razorpay_oauth_env
      revoke = stub_request(:post, RazorpayOauthHelpers::REVOKE_URL).to_return(status: 200, body: { message: "Token Revoked" }.to_json)
      expect(razorpay_oauth_status(provider)).to include(recovery_available: false)
      restored = PaymentProviders::RazorpayOauthConnection.new(provider: provider.reload, actor:)
      expect(restored.disconnect!).to eq(remote_revocation_confirmed: true)
      expect(revoke).to have_been_requested.once
    end
  end

  describe "returned tokens that lost their attempt" do
    let(:tokens) { razorpay_oauth_tokens.stringify_keys.except("token_type") }
    let(:fake_client) { instance_double(PaymentProviders::RazorpayOauthClient, identity: client.identity, revoke: true) }
    let(:stubbed) { PaymentProviders::RazorpayOauthConnection.new(provider:, actor:, client: fake_client) }

    def cancel_and_clear_during_exchange
      allow(fake_client).to receive(:exchange) do
        other = PaymentProviders::RazorpayOauthConnection.new(provider: PaymentsProvider.find(provider.id), actor:, client: fake_client)
        other.disconnect!
        other.request_recovery!(account_id: "acc_recovery")
        other.finish_recovery_with_evidence!(provider_reference: "RZP-12345")
        tokens
      end
    end

    it "keeps and revokes a token returned after the owner cleared the attempt" do
      cancel_and_clear_during_exchange
      state = stubbed.start!
      expect { stubbed.complete!(state:, browser_state: state, code: "synthetic-code") }.to raise_error(PaymentProviders::RazorpayOauthConnection::Error)
      expect(fake_client).to have_received(:revoke).with("synthetic-refresh").once
      expect(provider.reload.settings).not_to have_key("razorpay_oauth_credentials_ciphertext")
    end

    it "retains that token for retry when revocation fails" do
      cancel_and_clear_during_exchange
      allow(fake_client).to receive(:revoke).and_raise(PaymentProviders::RazorpayOauthClient::Error, "unavailable")
      state = stubbed.start!
      expect { stubbed.complete!(state:, browser_state: state, code: "synthetic-code") }.to raise_error(PaymentProviders::RazorpayOauthConnection::Error)
      expect(provider.reload.razorpay_oauth_credentials).to include("refresh_token" => "synthetic-refresh")
      expect(razorpay_oauth_status(provider)).to include(status: "revocation_pending", cleanup_pending: true)
    end

    it "marks an unknown grant when a newer grant owns the slot and revocation fails" do
      connect_razorpay_oauth(provider, actor)
      allow(fake_client).to receive(:revoke).and_raise(PaymentProviders::RazorpayOauthClient::Error, "unavailable")
      expect { stubbed.__send__(:reject_grant!, ["stale", "stale"], tokens.merge("refresh_token" => "orphan"), client.identity) }.not_to raise_error
      expect(provider.reload.razorpay_oauth_credentials).to include("refresh_token" => "synthetic-refresh")
      expect(razorpay_oauth_status(provider)).to include(status: "reconciliation_required")
    end
  end

  describe "recovery with a known token" do
    before do
      connect_razorpay_oauth(provider, actor)
      stub_razorpay_token(body: {}, status: 502)
      travel(2.hours) { expect { connection.access_token }.to raise_error(PaymentProviders::RazorpayOauthConnection::Error) }
    end

    it "exposes the retry the owner needs, then allows evidence once it resolves" do
      expect(razorpay_oauth_status(provider)).to include(status: "reconciliation_required", cleanup_pending: true, recovery_available: true)
      connection.request_recovery!(account_id: "")
      expect { connection.finish_recovery_with_evidence!(provider_reference: "RZP-12345") }
        .to raise_error(PaymentProviders::RazorpayOauthConnection::Error, /known grant/)
      stub_request(:post, RazorpayOauthHelpers::REVOKE_URL).to_return(status: 200, body: { message: "Token Revoked" }.to_json)
      connection.disconnect!
      expect(razorpay_oauth_status(provider)).to include(status: "recovery_pending", cleanup_pending: false)
      connection.finish_recovery_with_evidence!(provider_reference: "RZP-12345")
      expect(razorpay_oauth_status(provider)).to include(status: "reconnect_required")
    end
  end

  describe "refresh intent" do
    before { connect_razorpay_oauth(provider, actor) }

    def reserve(at)
      record = provider.reload
      record.settings.merge!("oauth_refresh_reservation" => "another-worker", "oauth_refresh_reserved_at" => at.to_i)
      record.save!
    end

    it "treats an abandoned reservation as an unknown grant" do
      travel 2.hours do
        reserve(2.minutes.ago)
        expect { connection.access_token }.to raise_error(PaymentProviders::RazorpayOauthConnection::Error)
      end
      expect(WebMock).not_to have_requested(:post, RazorpayOauthHelpers::TOKEN_URL).with(body: /refresh_token/)
      expect(razorpay_oauth_status(provider)).to include(status: "reconciliation_required", cleanup_pending: true)
      expect(provider.settings).not_to have_key("oauth_refresh_reservation")
    end

    it "asks a concurrent caller to retry without changing state" do
      travel 2.hours do
        reserve(Time.current)
        expect { connection.access_token }.to raise_error(PaymentProviders::RazorpayOauthConnection::RefreshInProgress)
      end
      expect(razorpay_oauth_status(provider)).to include(status: "connected")
    end

    it "clears its reservation after a successful refresh" do
      stub_razorpay_token(body: razorpay_oauth_tokens(access_token: "rotated-access", refresh_token: "rotated-refresh"))
      travel(2.hours) { expect(connection.access_token).to eq("rotated-access") }
      expect(provider.reload.settings).not_to have_key("oauth_refresh_reservation")
    end
  end

  describe "collection readiness" do
    before { connect_razorpay_oauth(provider, actor) }

    def blocker
      razorpay_oauth_status(provider).fetch(:collections_blocker)
    end

    def connect_in_live_mode
      stub_razorpay_oauth_env(MODE: "live")
      record = provider.reload
      record.razorpay_oauth_credentials = record.razorpay_oauth_credentials.merge("identity" => client.identity)
      record.settings["oauth_mode"] = "live"
      record.save!
    end

    it "does not report ready when the application cannot actually be used" do
      stub_razorpay_oauth_env(CLIENT_SECRET: "")
      expect(blocker).to eq("application_changed")
      stub_razorpay_oauth_env(REDIRECT_URI: "https://other.miru.example/payments/razorpay/callback")
      expect(blocker).to be_nil
    end

    it "survives a bad deploy: no downgrade, and restoring the config restores the connection" do
      stub_razorpay_oauth_env(CLIENT_SECRET: "")
      fresh = PaymentProviders::RazorpayOauthConnection.new(provider: provider.reload, actor: nil)
      expect { fresh.access_token }.to raise_error(PaymentProviders::RazorpayOauthConnection::Error)
      expect(razorpay_oauth_status(provider)).to include(status: "connected")
      stub_razorpay_oauth_env
      restored = PaymentProviders::RazorpayOauthConnection.new(provider: provider.reload, actor: nil)
      expect(restored.access_token).to eq("synthetic-access")
    end

    it "does not carry test-mode merchant status into a live reconnect" do
      PaymentProviders::RazorpayOauthConnection.new(provider: provider.reload, actor: nil).merchant_status_changed!("activated", occurred_at: 100, event_id: "evt")
      stub_request(:post, RazorpayOauthHelpers::REVOKE_URL).to_return(status: 200, body: { message: "Token Revoked" }.to_json)
      connection.disconnect!
      stub_razorpay_oauth_env(MODE: "live")
      stub_razorpay_token(body: razorpay_oauth_tokens(public_token: "rzp_live_oauth_synthetic"))
      live = PaymentProviders::RazorpayOauthConnection.new(provider: provider.reload, actor:)
      state = live.start!
      live.complete!(state:, browser_state: state, code: "synthetic-code")
      expect(razorpay_oauth_status(provider)).to include(status: "connected", merchant_status: nil, collections_blocker: "merchant_unconfirmed")
    end

    it "does not let a funds release override a suspension, and restores the status before a hold" do
      connect_in_live_mode
      updater = PaymentProviders::RazorpayOauthConnection.new(provider: provider.reload, actor: nil)
      updater.merchant_status_changed!("activated", occurred_at: 100, event_id: "evt_1")
      updater.merchant_status_changed!("funds_hold", occurred_at: 200, event_id: "evt_2")
      expect(blocker).to eq("merchant_funds_hold")
      updater.merchant_status_changed!("funds_unhold", occurred_at: 300, event_id: "evt_3")
      expect(blocker).to be_nil

      updater.merchant_status_changed!("suspended", occurred_at: 400, event_id: "evt_4")
      expect(updater.merchant_status_changed!("funds_unhold", occurred_at: 500, event_id: "evt_5")).to eq(:ignored)
      expect(blocker).to eq("merchant_suspended")
    end

    it "never reports payouts or live readiness from consent alone" do
      connect_in_live_mode
      expect(razorpay_oauth_status(provider)).to include(status: "connected", collections_ready: false, payouts_ready: false,
        collections_blocker: "merchant_unconfirmed")
      expect(provider).not_to be_razorpay_collectable
    end

    it "reports each independent blocker" do
      expect(blocker).to be_nil
      stub_razorpay_oauth_env(COLLECTIONS_ENABLED: "false")
      expect(blocker).to eq("collections_disabled")
      stub_razorpay_oauth_env(WEBHOOK_SECRET: "")
      expect(blocker).to eq("webhook_not_configured")
      stub_razorpay_oauth_env(CLIENT_ID: "another-client")
      expect(blocker).to eq("application_changed")
      stub_razorpay_oauth_env(MODE: "live")
      expect(blocker).to eq("application_changed")
    end

    it "requires a signed active merchant status in live mode and stops when it lapses" do
      connect_in_live_mode
      updater = PaymentProviders::RazorpayOauthConnection.new(provider: provider.reload, actor: nil)
      updater.merchant_status_changed!("activated", occurred_at: 100, event_id: "evt_1")
      expect(blocker).to be_nil
      connection.update_collections!(enabled: true)
      expect(provider.reload).to be_enabled.and be_razorpay_collectable

      expect(updater.merchant_status_changed!("activated", occurred_at: 50, event_id: "evt_0")).to eq(:ignored)
      updater.merchant_status_changed!("suspended", occurred_at: 200, event_id: "evt_2")
      expect(provider.reload).not_to be_enabled
      expect(blocker).to eq("merchant_suspended")
      expect { connection.update_collections!(enabled: true) }.to raise_error(PaymentProviders::RazorpayOauthConnection::Error, /not ready/)
    end

    it "keeps saving a connected provider when the application flag is later turned off" do
      connection.update_collections!(enabled: true)
      stub_razorpay_oauth_env(COLLECTIONS_ENABLED: "false")
      expect(provider.reload.update(accepted_payment_methods: ["razorpay"])).to be(true)
      expect(provider).not_to be_razorpay_collectable
    end

    it "refuses to enable an OAuth provider through the model until ready" do
      stub_razorpay_oauth_env(COLLECTIONS_ENABLED: "false")
      expect(provider.reload.update(enabled: true)).to be(false)
    end
  end
end

RSpec.describe PaymentProviders::RazorpayOauthConnection, "provider revocation concurrency" do
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

  def wait_for_row_lock(label)
    Timeout.timeout(5) do
      loop do
        break if ActiveRecord::Base.connection.select_value(
          "SELECT EXISTS(SELECT 1 FROM pg_stat_activity WHERE application_name = #{ActiveRecord::Base.connection.quote(label)} AND wait_event_type = 'Lock')")

        Thread.pass
      end
    end
  end

  it "leaves evidence when a worker dies after Razorpay may have rotated the token" do
    allow(client).to receive(:refresh).and_raise(Interrupt)
    travel 2.hours do
      connection = described_class.new(provider: PaymentsProvider.find(provider.id), actor: nil, client:)
      expect { connection.access_token }.to raise_error(Interrupt)
    end
    expect(provider.reload.settings).to have_key("oauth_refresh_reservation")
    travel 2.hours + 2.minutes do
      expect { described_class.new(provider: PaymentsProvider.find(provider.id), actor: nil, client:).access_token }.to raise_error(described_class::Error)
    end
    expect(described_class.new(provider: provider.reload, actor: nil, client:).status).to include(status: "reconciliation_required")
  end

  it "does not rotate a token inside a caller transaction that could roll back its intent" do
    travel 2.hours do
      connection = described_class.new(provider: PaymentsProvider.find(provider.id), actor: nil, client:)
      expect { Invoice.transaction { connection.access_token } }.to raise_error(described_class::RefreshInProgress)
    end
    expect(client).not_to have_received(:refresh)
    expect(provider.reload.settings).not_to have_key("oauth_refresh_reservation")
    expect(provider).to be_connected
  end

  it "does not rotate without a reservation when the token reaches its refresh boundary between locks" do
    travel_to(Time.current.change(usec: 0)) do
      record = provider.reload
      record.razorpay_oauth_credentials = record.razorpay_oauth_credentials.merge("expires_at" => 61.seconds.from_now.to_i)
      record.save!
      locks = 0
      allow(record).to receive(:with_lock).and_wrap_original do |original, &block|
        locks += 1
        travel 2.seconds if locks == 2
        original.call(&block)
      end
      connection = described_class.new(provider: record, actor: nil, client:)
      expect { connection.access_token }.to raise_error(described_class::RefreshInProgress)
    end
    expect(client).not_to have_received(:refresh)
    expect(provider.reload.settings).not_to have_key("oauth_refresh_reservation")
    expect(provider).to be_connected
  end

  it "waits for an in-flight refresh and leaves no usable token behind" do
    entered, release = Queue.new, Queue.new
    allow(client).to receive(:refresh) do
      entered << true
      release.pop
      tokens.merge("access_token" => "rotated_access", "refresh_token" => "rotated_refresh")
    end
    provider_id, actor_id = provider.id, actor.id
    travel 2.hours do
      @threads << Thread.new do
        Thread.current.report_on_exception = false
        ActiveRecord::Base.connection_pool.with_connection do
          described_class.new(provider: PaymentsProvider.find(provider_id), actor: User.find(actor_id), client:).access_token
        end
      end
      Timeout.timeout(5) { entered.pop }
      @threads << Thread.new do
        Thread.current.report_on_exception = false
        ActiveRecord::Base.connection_pool.with_connection do |database|
          database.execute("SET application_name = 'miru_oauth_provider_revocation'")
          described_class.new(provider: PaymentsProvider.find(provider_id), actor: nil).provider_revoked!(occurred_at: Time.current.to_i, event_id: "evt_race")
        ensure
          database.execute("RESET application_name")
        end
      end
      wait_for_row_lock("miru_oauth_provider_revocation")
      release << true
      expect(Timeout.timeout(5) { @threads.last.value }).to eq(:revoked)
    end
    record = provider.reload
    expect(record.settings).not_to have_key("razorpay_oauth_credentials_ciphertext")
    expect(record).not_to be_connected
    expect { described_class.new(provider: record, actor: nil, client:).access_token }.to raise_error(described_class::Error)
  ensure
    release << true
  end
end
