# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Razorpay merchant connection", type: :request do
  let(:company) { create(:company) }
  let(:owner) { create(:user, current_workspace: company) }
  let!(:employment) { create(:employment, company:, user: owner, resigned_at: nil) }
  let(:endpoint) { "/payments/razorpay/connection" }
  let(:callback) { "/payments/razorpay/callback" }
  let(:tokens) do
    { token_type: "Bearer", access_token: "synthetic-access", refresh_token: "synthetic-refresh",
      public_token: "rzp_test_oauth_synthetic", expires_in: 3600, razorpay_account_id: "acc_synthetic" }
  end

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
    owner.add_role(:owner, company)
    sign_in owner
    allow(ENV).to receive(:[]).and_call_original
    { "ENABLED" => "true", "CLIENT_ID" => "synthetic-client", "CLIENT_SECRET" => "synthetic-secret",
      "REDIRECT_URI" => "https://app.miru.example#{callback}", "MODE" => "test" }.each do |key, value|
      allow(ENV).to receive(:[]).with("RAZORPAY_OAUTH_#{key}").and_return(value)
    end
    stub_request(:post, "https://auth.razorpay.com/token").to_return(status: 200, body: tokens.to_json)
  end

  def start_connection
    post endpoint, as: :json
    expect(response).to have_http_status(:ok)
    URI.decode_www_form(URI(response.parsed_body.fetch("url")).query).to_h.fetch("state")
  end

  it "creates a disabled zero-fee provider and keeps the one-use raw state out of persisted settings" do
    state = start_connection
    record = company.payments_providers.find_by!(name: "razorpay")
    expect(record).not_to be_enabled
    expect(record.platform_fee_percent.to_d).to be_zero
    expect(record.payouts_enabled?).to be(false)
    expect(record.route_transfers_enabled?).to be(false)
    expect(record.reload.settings.to_json).not_to include(state, "synthetic-secret")
    expect(response.headers["Cache-Control"]).to include("private", "no-store")
    expect(response.headers["Referrer-Policy"]).to eq("no-referrer")
  end

  it "completes consent in the initiating session, encrypts tokens and exposes only redacted connection status" do
    state = start_connection
    get callback, params: { state:, code: "synthetic-code", return_to: "https://untrusted.example" }
    expect(response).to redirect_to("/settings/payment?razorpay=connected")
    record = company.payments_providers.find_by!(name: "razorpay")
    expect(record).to be_connected
    expect(record).not_to be_enabled
    expect(record.razorpay_configured?).to be(false)
    raw = PaymentsProvider.connection.select_value("SELECT settings::text FROM payments_providers WHERE id=#{record.id}")
    expect(raw).not_to include("synthetic-access", "synthetic-refresh", "synthetic-code")

    get endpoint, as: :json
    expect(response.parsed_body.fetch("connection")).to include("status" => "connected", "account_id" => "acc_synthetic",
      "mode" => "test", "collections_ready" => false, "payouts_ready" => false)
    expect(response.body).not_to include("synthetic-access", "synthetic-refresh", "synthetic-secret", "ciphertext", state)

    get callback, params: { state:, code: "synthetic-code" }
    expect(response).to redirect_to("/settings/payment?razorpay=failed")
    expect(a_request(:post, "https://auth.razorpay.com/token")).to have_been_made.once
  end

  it "requires both browser and database state before exchanging a code" do
    start_connection
    get callback, params: { state: "a" * 64, code: "synthetic-code" }
    expect(response).to redirect_to("/settings/payment?razorpay=failed")
    expect(WebMock).not_to have_requested(:post, "https://auth.razorpay.com/token")
  end

  it "review regression: an older callback preserves the newer browser consent state" do
    old_state = start_connection
    new_state = start_connection
    get callback, params: { state: old_state, code: "old-code" }
    expect(response).to redirect_to("/settings/payment?razorpay=failed")
    get callback, params: { state: new_state, code: "new-code" }
    expect(response).to redirect_to("/settings/payment?razorpay=connected")
    expect(a_request(:post, "https://auth.razorpay.com/token")).to have_been_made.once
  end

  it "handles denied consent without an upstream token request" do
    state = start_connection
    get callback, params: { state:, error: "access_denied", error_description: "Do not reflect this" }
    expect(response).to redirect_to("/settings/payment?razorpay=denied")
    expect(WebMock).not_to have_requested(:post, "https://auth.razorpay.com/token")
  end

  it "does not create provider records when partner configuration is unavailable" do
    allow(ENV).to receive(:[]).with("RAZORPAY_OAUTH_ENABLED").and_return("false")
    expect { post endpoint, as: :json }.not_to change(PaymentsProvider, :count)
    expect(response).to have_http_status(:service_unavailable)
  end

  it "rejects an existing key-based account without changing its settings" do
    record = create(:payments_provider, company:, name: "razorpay", settings: { key_id: "rzp_test_existing" })
    record.key_secret = "synthetic-existing-secret"
    record.save!
    previous = record.settings.deep_dup
    post endpoint, as: :json
    expect(response).to have_http_status(:conflict)
    expect(record.reload.settings).to eq(previous)
  end

  %i[employee client].each do |role|
    it "denies #{role} access to connection management" do
      owner.remove_role(:owner, company)
      owner.add_role(role, company)
      post endpoint, as: :json
      expect(response).to have_http_status(:forbidden)
      expect(company.payments_providers.where(name: "razorpay")).not_to exist
    end
  end

  it "does not complete consent after the owner loses active membership" do
    state = start_connection
    employment.update_column(:discarded_at, Time.current)
    get callback, params: { state:, code: "synthetic-code" }
    expect(WebMock).not_to have_requested(:post, "https://auth.razorpay.com/token")
    expect(company.payments_providers.find_by!(name: "razorpay")).not_to be_connected
  end

  it "requires CSRF protection before starting the external authorization flow" do
    original = RazorpayConnectionsController.allow_forgery_protection
    RazorpayConnectionsController.allow_forgery_protection = true
    post endpoint, as: :json
    expect(response).to have_http_status(:unprocessable_entity)
    expect(company.payments_providers.where(name: "razorpay")).not_to exist
    expect(WebMock).not_to have_requested(:post, "https://auth.razorpay.com/token")
  ensure
    RazorpayConnectionsController.allow_forgery_protection = original
  end

  it "keeps authorization codes out of referrers even when the browser session expired" do
    sign_out owner
    get callback, params: { state: "a" * 64, code: "synthetic-code" }
    expect(response.headers["Referrer-Policy"]).to eq("no-referrer")
    expect(response.headers["Cache-Control"]).to include("private", "no-store")
    expect(WebMock).not_to have_requested(:post, "https://auth.razorpay.com/token")
  end

  context "when the callback carries a code and state" do
    let(:browser) { { "User-Agent" => "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/130.0 Safari/537.36" } }

    it "keeps them out of visit analytics when the visit cookie expired during consent" do
      state = start_connection
      cookies.delete("ahoy_visit")
      get callback, params: { state:, code: "synthetic-code" }, headers: browser
      expect(response).to redirect_to("/settings/payment?razorpay=connected")
      expect(Ahoy::Visit.pluck(:landing_page).compact.join).not_to include("synthetic-code", state)
    end

    it "keeps them out of visit analytics when the session expired" do
      sign_out owner
      get callback, params: { state: "a" * 64, code: "synthetic-code" }, headers: browser
      expect(Ahoy::Visit.pluck(:landing_page).compact.join).not_to include("synthetic-code", "a" * 64)
    end

    it "filters them from logged parameters and the logged path" do
      payloads = []
      capture = ->(*, payload) { payloads << payload }
      ActiveSupport::Notifications.subscribed(capture, "process_action.action_controller") do
        get callback, params: { state: "a" * 64, code: "synthetic-code" }
      end
      logged = payloads.find { |payload| payload[:controller] == "RazorpayConnectionsController" }
      expect(logged).to be_present
      expect(logged[:path]).to start_with(callback)
      expect(logged[:path]).not_to include("synthetic-code", "a" * 64)
      expect(logged[:params]).to include("code" => "[FILTERED]", "state" => "[FILTERED]")
      expect(response.location).not_to include("synthetic-code", "a" * 64)
    end
  end

  it "filters every OAuth secret from logged parameters" do
    filter = ActiveSupport::ParameterFilter.new(Rails.application.config.filter_parameters)
    secrets = %w[code state nonce code_verifier access_token refresh_token public_token client_secret]
    expect(filter.filter(secrets.index_with("synthetic")).values.uniq).to eq(["[FILTERED]"])
  end

  it "denies access instead of failing when the user has no workspace" do
    workspace_less = create(:user, current_workspace: nil)
    sign_out owner
    sign_in workspace_less
    get endpoint, as: :json
    expect(response).to have_http_status(:forbidden)
    expect(response.body).not_to include("NoMethodError", "undefined")
  end

  context "when reporting availability" do
    it "never offers connect to an API-key provider" do
      create(:payments_provider, company:, name: "razorpay", settings: { key_id: "rzp_test_existing" })
      get endpoint, as: :json
      expect(response.parsed_body).to include("connect_available" => false, "unavailable_reason" => "legacy_api_keys", "api_keys_blocked" => false)
    end

    it "explains missing application credentials without creating a provider" do
      allow(ENV).to receive(:[]).with("RAZORPAY_OAUTH_CLIENT_ID").and_return(nil)
      expect { get endpoint, as: :json }.not_to change(PaymentsProvider, :count)
      expect(response.parsed_body).to include("connect_available" => false, "unavailable_reason" => "not_configured")
    end

    it "reports a clean workspace as connectable and never reports payouts" do
      get endpoint, as: :json
      expect(response.parsed_body).to include("connect_available" => true, "unavailable_reason" => nil)
      expect(response.parsed_body.fetch("connection")).to include("status" => "disconnected", "payouts_ready" => false, "collections_ready" => false)
    end
  end

  context "when mutations are rate limited" do
    before { allow(RazorpayConnectionsController.cache_store).to receive(:increment).and_return(100) }

    {
      "POST connection" => [:post, "/payments/razorpay/connection"],
      "PATCH connection" => [:patch, "/payments/razorpay/connection"],
      "DELETE connection" => [:delete, "/payments/razorpay/connection"],
      "POST recovery" => [:post, "/payments/razorpay/connection/recovery"],
      "POST recovery evidence" => [:post, "/payments/razorpay/connection/recovery/evidence"],
      "POST payment review" => [:post, "/payments/razorpay/connection/payment_review"]
    }.each do |label, (verb, path)|
      it "throttles #{label}" do
        public_send(verb, path, as: :json)
        expect(response).to have_http_status(:too_many_requests)
      end
    end

    it "throttles the callback with a safe redirect" do
      get callback, params: { state: "a" * 64, code: "synthetic-code" }
      expect(response).to redirect_to("/settings/payment?razorpay=failed")
      expect(WebMock).not_to have_requested(:post, "https://auth.razorpay.com/token")
    end
  end

  context "when managing collections and recovery over HTTP" do
    let(:recovery) { "#{endpoint}/recovery" }

    before do
      allow(ENV).to receive(:[]).with("RAZORPAY_OAUTH_COLLECTIONS_ENABLED").and_return("true")
      allow(ENV).to receive(:[]).with("RAZORPAY_OAUTH_WEBHOOK_SECRET").and_return("synthetic-webhook-secret")
    end

    it "lets an owner turn collection on and off once ready" do
      state = start_connection
      get callback, params: { state:, code: "synthetic-code" }
      patch endpoint, params: { enabled: true }, as: :json
      expect(response.parsed_body.fetch("connection")).to include("collections_enabled" => true, "payouts_ready" => false)
      expect(company.payments_providers.find_by!(name: "razorpay")).to be_enabled
      patch endpoint, params: { enabled: false }, as: :json
      expect(response.parsed_body.fetch("connection")).to include("collections_enabled" => false)
    end

    it "refuses to enable collection before the account is ready" do
      start_connection
      patch endpoint, params: { enabled: true }, as: :json
      expect(response).to have_http_status(:conflict)
      expect(company.payments_providers.find_by!(name: "razorpay")).not_to be_enabled
    end

    it "walks an owner through recovery with no console step" do
      stub_request(:post, "https://auth.razorpay.com/token").to_timeout
      state = start_connection
      get callback, params: { state:, code: "synthetic-code" }
      expect(response).to redirect_to("/settings/payment?razorpay=failed")
      get endpoint, as: :json
      expect(response.parsed_body.fetch("connection")).to include("status" => "reconciliation_required")
      post endpoint, as: :json
      expect(response).to have_http_status(:conflict)

      post recovery, params: { account_id: "acc_recovery" }, as: :json
      expect(response.parsed_body.fetch("connection")).to include("status" => "recovery_pending", "account_id" => "acc_recovery")
      post "#{recovery}/evidence", params: { provider_reference: "RZP-12345" }, as: :json
      expect(response.parsed_body.fetch("connection")).to include("status" => "reconnect_required")
      post endpoint, as: :json
      expect(response).to have_http_status(:ok)
    end

    %i[employee client].each do |role|
      it "denies #{role} access to collection and recovery" do
        owner.remove_role(:owner, company)
        owner.add_role(role, company)
        [[:patch, endpoint], [:post, recovery], [:post, "#{recovery}/evidence"], [:post, "#{endpoint}/payment_review"], [:delete, endpoint]].each do |verb, path|
          public_send(verb, path, as: :json)
          expect(response).to have_http_status(:forbidden)
        end
      end
    end

    it "requires CSRF protection on every mutation" do
      original = RazorpayConnectionsController.allow_forgery_protection
      RazorpayConnectionsController.allow_forgery_protection = true
      [[:patch, endpoint], [:delete, endpoint], [:post, recovery], [:post, "#{recovery}/evidence"], [:post, "#{endpoint}/payment_review"]].each do |verb, path|
        public_send(verb, path, as: :json)
        expect(response).to have_http_status(:unprocessable_entity)
      end
    ensure
      RazorpayConnectionsController.allow_forgery_protection = original
    end

    it "shows OAuth audit entries to owners without token material" do
      state = start_connection
      get callback, params: { state:, code: "synthetic-code" }
      patch endpoint, params: { enabled: true }, as: :json
      get "/api/v1/audit_logs", headers: auth_headers(owner), as: :json
      expect(response.body).not_to include("synthetic-access", "synthetic-refresh", "synthetic-code", state)
    end
  end

  context "when disconnecting and returning to API-key setup" do
    let(:api_key_settings) { "/api/v1/payments/settings/razorpay" }
    let(:api_keys) { { provider: { key_id: "rzp_test_new", key_secret: "synthetic-new" } } }

    it "leaves a provider that never used OAuth untouched while the feature is disabled" do
      allow(ENV).to receive(:[]).with("RAZORPAY_OAUTH_ENABLED").and_return("false")
      record = create(:payments_provider, company:, name: "razorpay", settings: { platform_fee_percent: "0", enabled_on_invoices: true })
      previous = record.reload.settings.deep_dup
      delete endpoint, as: :json
      expect(response).to have_http_status(:conflict)
      expect(record.reload.settings).to eq(previous)
      patch api_key_settings, params: api_keys, as: :json
      expect(response).to have_http_status(:ok)
      expect(record.reload).to be_razorpay_configured
    end

    it "lets an owner save API keys after denied consent and disconnect" do
      state = start_connection
      get callback, params: { state:, error: "access_denied" }
      delete endpoint, as: :json
      expect(response).to have_http_status(:ok)
      patch api_key_settings, params: api_keys, as: :json
      expect(response).to have_http_status(:ok)
      record = company.payments_providers.find_by!(name: "razorpay")
      expect(record).to be_razorpay_configured
      expect(record.settings).not_to have_key("authentication_mode")
    end

    it "blocks API keys while consent is pending and frees them after disconnect" do
      start_connection
      patch api_key_settings, params: api_keys, as: :json
      expect(response).to have_http_status(:conflict)
      delete endpoint, as: :json
      patch api_key_settings, params: api_keys, as: :json
      expect(response).to have_http_status(:ok)
    end

    it "revokes a connected grant on disconnect and reports it through the HTTP boundary" do
      stub_request(:post, "https://auth.razorpay.com/revoke").to_return(status: 200, body: { message: "Token Revoked" }.to_json)
      state = start_connection
      get callback, params: { state:, code: "synthetic-code" }
      delete endpoint, as: :json
      expect(response).to have_http_status(:ok)
      expect(response.parsed_body).to include("remote_revocation_confirmed" => true)
      expect(response.parsed_body.fetch("connection")).to include("status" => "disconnected", "collections_ready" => false, "payouts_ready" => false)
      expect(response.body).not_to include("synthetic-access", "synthetic-refresh")
    end

    it "keeps API keys blocked while cleanup material could not be revoked" do
      stub_request(:post, "https://auth.razorpay.com/revoke").to_return(status: 500, body: "")
      state = start_connection
      get callback, params: { state:, code: "synthetic-code" }
      delete endpoint, as: :json
      expect(response.parsed_body).to include("remote_revocation_confirmed" => false)
      expect(response.parsed_body.fetch("connection")).to include("status" => "revocation_pending")
      patch api_key_settings, params: api_keys, as: :json
      expect(response).to have_http_status(:conflict)
    end
  end

  context "when a callback fails before any grant could exist" do
    [{ code: ["synthetic-code"] }, { code: { nested: "synthetic-code" } }, { code: "a" * 16_385 }, { code: "a\r\nb" }].each do |invalid|
      it "allows a clean restart after the unusable code #{invalid[:code].class}" do
        state = start_connection
        get callback, params: { state: }.merge(invalid)
        expect(response).to redirect_to("/settings/payment?razorpay=failed")
        expect(WebMock).not_to have_requested(:post, "https://auth.razorpay.com/token")
        get endpoint, as: :json
        expect(response.parsed_body.fetch("connection")).to include("status" => "reconnect_required")
        post endpoint, as: :json
        expect(response).to have_http_status(:ok)
      end
    end
  end

  it "fails closed through the callback when the provider response cannot be decompressed" do
    stub_request(:post, "https://auth.razorpay.com/token").to_raise(Zlib::DataError.new("incorrect header check"))
    state = start_connection
    get callback, params: { state:, code: "synthetic-code" }
    expect(response).to redirect_to("/settings/payment?razorpay=failed")
    get endpoint, as: :json
    expect(response.parsed_body.fetch("connection")).to include("status" => "reconciliation_required")
  end

  it "cannot replace OAuth credentials through the existing API-key settings endpoint" do
    state = start_connection
    get callback, params: { state:, code: "synthetic-code" }
    record = company.payments_providers.find_by!(name: "razorpay")
    previous = record.settings.deep_dup
    patch "/api/v1/payments/settings/razorpay", params: { provider: { key_id: "rzp_live_other", key_secret: "other-secret" } }, as: :json
    expect(response).to have_http_status(:conflict)
    expect(record.reload.settings).to eq(previous)
  end
end

RSpec.describe "Razorpay API key update concurrency", type: :request do
  around do |example|
    VCR.turned_off do
      WebMock.disable_net_connect!
      example.run
    end
  end

  before do
    DatabaseCleaner.clean
    DatabaseCleaner.strategy = :deletion, { except: %w[ar_internal_metadata schema_migrations] }
    stub_request(:get, %r{\Ahttps://api\.pwnedpasswords\.com/range/}).to_return(status: 200, body: "")
    @company = create(:company)
    @owner = create(:user, current_workspace: @company, token: "synthetic-auth-token")
    create(:employment, user: @owner, company: @company, resigned_at: nil)
    @owner.add_role(:owner, @company)
    @threads = []
  end

  after do
    @threads.each { |thread| thread.kill if thread.alive? }
    @threads.each(&:join)
  end

  def tenant_insert(database)
    database.transaction do
      database.execute("SET LOCAL lock_timeout = '500ms'")
      database.execute(ActiveRecord::Base.sanitize_sql_array([
        "INSERT INTO clients (name, company_id, email, created_at, updated_at) VALUES ('synthetic', ?, 'synthetic@example.com', NOW(), NOW())",
        @company.id
      ]))
      raise ActiveRecord::Rollback
    end
    :inserted
  rescue ActiveRecord::LockWaitTimeout
    :blocked
  end

  it "holds no company lock while rendering Stripe status from an API-key update" do
    StripeConnectedAccount.create!(company: @company, account_id: "acct_synthetic")
    inserted = nil
    allow(Stripe::Account).to receive(:retrieve) do
      inserted = Thread.new { ActiveRecord::Base.connection_pool.with_connection { |database| tenant_insert(database) } }.value
      double(details_submitted: true)
    end
    patch "/api/v1/payments/settings/razorpay", params: { provider: { key_id: "rzp_test_new", key_secret: "synthetic-new" } },
      headers: { "X-Auth-Email" => @owner.email, "X-Auth-Token" => @owner.token }, as: :json
    expect(response).to have_http_status(:ok)
    expect(inserted).to eq(:inserted)
  end

  it "does not stall tenant inserts while an API-key update waits for the provider row" do
    provider = create(:payments_provider, company: @company, name: "razorpay", settings: { platform_fee_percent: "0" })
    entered, release = Queue.new, Queue.new
    @threads << Thread.new do
      ActiveRecord::Base.connection_pool.with_connection do
        PaymentsProvider.find(provider.id).with_lock do
          entered << true
          release.pop
        end
      end
    end
    Timeout.timeout(5) { entered.pop }
    @threads << Thread.new do
      Thread.current.report_on_exception = false
      ActiveRecord::Base.connection_pool.with_connection do |database|
        database.execute("SET application_name = 'miru_legacy_provider_wait'")
        browser = ActionDispatch::Integration::Session.new(Rails.application)
        browser.patch "/api/v1/payments/settings/razorpay", params: { provider: { key_id: "rzp_test_other", key_secret: "synthetic-other" } },
          headers: { "X-Auth-Email" => @owner.email, "X-Auth-Token" => @owner.token }, as: :json
        browser.response.status
      ensure
        database.execute("RESET application_name")
      end
    end
    Timeout.timeout(5) do
      loop do
        break if ActiveRecord::Base.connection.select_value(
          "SELECT EXISTS(SELECT 1 FROM pg_stat_activity WHERE application_name = 'miru_legacy_provider_wait' AND wait_event_type = 'Lock')")

        Thread.pass
      end
    end
    expect(tenant_insert(ActiveRecord::Base.connection)).to eq(:inserted)
    release << true
    expect(Timeout.timeout(5) { @threads.last.value }).to eq(200)
  ensure
    release << true
  end

  [true, false].each do |existing_provider|
    it "review regression: serializes legacy assignment with OAuth #{existing_provider ? 'state commit' : 'provider creation'}" do
      provider = create(:payments_provider, company: @company, name: "razorpay", settings: { platform_fee_percent: "0" }) if existing_provider
      entered, release = Queue.new, Queue.new
      @threads << Thread.new do
        ActiveRecord::Base.connection_pool.with_connection do
          company = Company.find(@company.id)
          record = PaymentsProvider.find(provider.id) if existing_provider
          (record || company).with_lock do
            record ||= company.payments_providers.build(name: "razorpay", settings: { platform_fee_percent: "0" })
            record.settings["authentication_mode"] = "oauth"
            record.settings["oauth_state"] = { "digest" => "synthetic-digest" }
            record.razorpay_oauth_credentials = { "refresh_token" => "synthetic-refresh" }
            record.save!
            entered << true
            release.pop
          end
        end
      end
      Timeout.timeout(5) { entered.pop }
      @threads << Thread.new do
        Thread.current.report_on_exception = false
        ActiveRecord::Base.connection_pool.with_connection do |database|
          database.execute("SET application_name = 'miru_legacy_oauth_race'")
          browser = ActionDispatch::Integration::Session.new(Rails.application)
          browser.patch "/api/v1/payments/settings/razorpay", params: { provider: { key_id: "rzp_test_other", key_secret: "synthetic-other" } },
            headers: { "X-Auth-Email" => @owner.email, "X-Auth-Token" => @owner.token }, as: :json
          browser.response.status
        ensure
          database.execute("RESET application_name")
        end
      end
      Timeout.timeout(5) do
        loop do
          break if ActiveRecord::Base.connection.select_value(
            "SELECT EXISTS(SELECT 1 FROM pg_stat_activity WHERE application_name = 'miru_legacy_oauth_race' AND wait_event_type = 'Lock')")

          Thread.pass
        end
      end
      release << true
      expect(Timeout.timeout(5) { @threads.last.value }).to eq(409)
      Timeout.timeout(5) { @threads.first.value }
      provider = @company.payments_providers.find_by!(name: "razorpay")
      expect(provider.settings).to include("authentication_mode" => "oauth", "oauth_state" => { "digest" => "synthetic-digest" })
      expect(provider.razorpay_oauth_credentials).to eq("refresh_token" => "synthetic-refresh")
      expect(provider.key_id).to be_blank
    ensure
      release << true
    end
  end
end
