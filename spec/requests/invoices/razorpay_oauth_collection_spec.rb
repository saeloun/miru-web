# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Razorpay OAuth invoice collection", type: :request do
  before do
    # Exercise token rotation with durable commits, matching real requests.
    DatabaseCleaner.clean
    DatabaseCleaner.strategy = :deletion, { except: %w[ar_internal_metadata schema_migrations] }
  end

  let(:company) { create(:india_company, base_currency: "INR") }
  let(:owner) { create(:user, current_workspace: company) }
  let!(:employment) { create(:employment, company:, user: owner, resigned_at: nil) }
  let(:client) { create(:client, company:, currency: "INR", name: "Acme", email: "client@example.com") }
  let(:invoice) do
    create(:invoice, company:, client:, currency: "INR", amount: 1000, amount_due: 1000, amount_paid: 0, status: "sent",
      payment_infos: {})
  end
  let(:provider) { create(:payments_provider, company:, name: "razorpay", settings: { platform_fee_percent: "0" }) }
  let(:links_url) { "https://api.razorpay.com/v1/payment_links" }
  let(:link) do
    { id: "plink_oauth", short_url: "https://rzp.io/rzp/oauth", status: "created", amount: 100_000, amount_paid: 0, currency: "INR",
      reference_id: "miru-inv-#{invoice.id}-abcd1234", notes: { miru_invoice_id: invoice.id.to_s, company_id: company.id.to_s } }
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
    stub_razorpay_oauth_env
    connect_razorpay_oauth(provider, owner)
    PaymentProviders::RazorpayOauthConnection.new(provider:, actor: owner).update_collections!(enabled: true)
    allow(RazorpayPayoutJob).to receive(:perform_later)
  end

  def start_payment
    get new_invoice_payment_path(invoice_id: invoice.external_view_key)
  end

  def bound_invoice(**overrides)
    invoice.update!(payment_infos: { "razorpay_payment_link_id" => "plink_oauth", "razorpay_payment_link_url" => "https://rzp.io/rzp/oauth",
      "razorpay_payment_link_account_id" => "acc_synthetic" }.merge(overrides.stringify_keys))
    invoice
  end

  def paid_link(**overrides)
    link.merge(status: "paid", amount_paid: 100_000, payments: [{ payment_id: "pay_oauth", status: "captured", amount: 100_000 }]).merge(overrides)
  end

  def payment_review
    PaymentProviders::RazorpayPaymentReview.reviews_for(invoice.reload).values.first
  end

  def stub_fetch(body)
    stub_request(:get, "#{links_url}/plink_oauth").to_return(status: 200, body: body.to_json, headers: { "Content-Type" => "application/json" })
  end

  def return_from_razorpay(**overrides)
    get razorpay_success_invoice_payments_path(invoice_id: invoice.external_view_key), params: {
      razorpay_payment_link_id: "plink_oauth", razorpay_payment_link_reference_id: "miru-inv-#{invoice.id}-abcd1234",
      razorpay_payment_link_status: "paid", razorpay_payment_id: "pay_oauth", razorpay_signature: "not-verifiable"
    }.merge(overrides)
  end

  describe "starting a payment" do
    it "creates an account-bound link with the merchant bearer token and no API key or fee transfer" do
      create_link = stub_request(:post, links_url).with(headers: { "Authorization" => "Bearer synthetic-access" })
        .to_return(status: 200, body: link.to_json, headers: { "Content-Type" => "application/json" })
      start_payment
      expect(response).to redirect_to("https://rzp.io/rzp/oauth")
      expect(create_link).to have_been_requested
      expect(a_request(:post, links_url).with { |request|
        body = JSON.parse(request.body)
        body["amount"] == 100_000 && body["currency"] == "INR" && body["accept_partial"] == false &&
          body["reference_id"].start_with?("miru-inv-#{invoice.id}-") && body.dig("notes", "company_id") == company.id.to_s &&
          !body.key?("options")
      }).to have_been_made
      expect(invoice.reload.razorpay_payment_link_account_id).to eq("acc_synthetic")
    end

    it "restores global SDK credentials after a merchant request" do
      Razorpay.setup("legacy_key", "legacy_secret")
      stub_request(:post, links_url).to_return(status: 200, body: link.to_json, headers: { "Content-Type" => "application/json" })
      start_payment
      expect(Razorpay.auth_type).to eq(Razorpay::PRIVATE_AUTH)
      expect(Razorpay.auth).to eq(username: "legacy_key", password: "legacy_secret")
      expect(Razorpay.access_token).not_to eq("synthetic-access")
    ensure
      Razorpay.auth = Razorpay.auth_type = Razorpay.access_token = nil
    end

    it "refreshes an expired token before using it, outside the SDK mutex" do
      stub_razorpay_token(body: razorpay_oauth_tokens(access_token: "rotated-access", refresh_token: "rotated-refresh"))
      create_link = stub_request(:post, links_url).with(headers: { "Authorization" => "Bearer rotated-access" })
        .to_return(status: 200, body: link.to_json, headers: { "Content-Type" => "application/json" })
      allow(PaymentProviders::RazorpayClient::SDK_MUTEX).to receive(:synchronize).and_wrap_original do |original, &block|
        expect(a_request(:post, RazorpayOauthHelpers::TOKEN_URL).with(body: /"grant_type":"refresh_token"/)).to have_been_made.once
        original.call(&block)
      end
      travel(2.hours) { start_payment }
      expect(create_link).to have_been_requested
    end

    it "does not fall back to a minimal payload that would lose the invoice binding" do
      stub_request(:post, links_url).to_return(status: 400, body: { error: { code: "BAD_REQUEST_ERROR", description: "amount must be a whole number" } }.to_json,
        headers: { "Content-Type" => "application/json" })
      start_payment
      expect(a_request(:post, links_url)).to have_been_made.once
    end

    it "reuses a matching link and replaces a stale amount after cancelling it" do
      bound_invoice
      stub_fetch(link)
      start_payment
      expect(response).to redirect_to("https://rzp.io/rzp/oauth")
      expect(a_request(:post, links_url)).not_to have_been_made

      stub_fetch(link.merge(amount: 50_000))
      cancel = stub_request(:post, "#{links_url}/plink_oauth/cancel").to_return(status: 200, body: link.merge(status: "cancelled").to_json,
        headers: { "Content-Type" => "application/json" })
      stub_request(:post, links_url).to_return(status: 200, body: link.merge(id: "plink_new", short_url: "https://rzp.io/rzp/new").to_json,
        headers: { "Content-Type" => "application/json" })
      start_payment
      expect(cancel).to have_been_requested
      expect(response).to redirect_to("https://rzp.io/rzp/new")
      expect(invoice.reload.razorpay_payment_link_id).to eq("plink_new")
    end

    it "settles a paid link whose webhook and callback were lost, instead of a second link" do
      bound_invoice
      stub_fetch(paid_link)
      start_payment
      expect(a_request(:post, links_url)).not_to have_been_made
      expect(invoice.reload).to be_paid
      expect(invoice.payments.last).to have_attributes(provider_event_id: "razorpay:pay_oauth")
    end

    it "flags a paid link that no longer matches, then lets an owner clear it for a new link" do
      bound_invoice
      invoice.update!(amount_due: 600)
      stub_fetch(paid_link)
      start_payment
      expect(response).to redirect_to(cancel_invoice_payments_url(invoice.external_view_key, reason: "confirming"))
      expect(invoice.reload).not_to be_paid
      expect(payment_review).to include("payment_id" => "pay_oauth", "reason" => "paid_link_mismatch")

      start_payment
      expect(a_request(:get, "#{links_url}/plink_oauth")).to have_been_made.once
      expect(a_request(:post, links_url)).not_to have_been_made

      sign_in owner
      get "/payments/razorpay/connection", as: :json
      expect(response.parsed_body.dig("connection", "payments_needing_review").first).to include("invoice_id" => invoice.id, "amount" => 100_000)
      post "/payments/razorpay/connection/payment_review", params: { invoice_id: invoice.id, review_id: "pay_oauth" }, as: :json
      expect(response).to have_http_status(:ok)
      expect(response.parsed_body.dig("connection", "payments_needing_review")).to eq([])
      expect(Audited::Audit.where(auditable: invoice).pluck(:action)).to include("razorpay_oauth_payment_needs_review", "razorpay_oauth_payment_review_resolved")

      stub_request(:post, links_url).to_return(status: 200, body: link.merge(id: "plink_new", short_url: "https://rzp.io/rzp/new", amount: 60_000).to_json,
        headers: { "Content-Type" => "application/json" })
      start_payment
      expect(response).to redirect_to("https://rzp.io/rzp/new")
    end

    it "does not let another company's owner clear a review" do
      bound_invoice(razorpay_payment_review: { "payment_id" => "pay_oauth", "amount" => 100_000 })
      other_company = create(:company)
      other_owner = create(:user, current_workspace: other_company)
      create(:employment, company: other_company, user: other_owner, resigned_at: nil)
      other_owner.add_role(:owner, other_company)
      sign_in other_owner
      post "/payments/razorpay/connection/payment_review", params: { invoice_id: invoice.id, review_id: "pay_oauth" }, as: :json
      expect(response).to have_http_status(:not_found)
      expect(payment_review).to be_present
    end

    it "shows the public invoice as payable through Razorpay only when collectable" do
      get "/api/v1/invoices/#{invoice.external_view_key}/view", as: :json
      expect(response.parsed_body.dig("razorpay_payment", "enabled")).to be(true)
      stub_razorpay_oauth_env(COLLECTIONS_ENABLED: "false")
      get "/api/v1/invoices/#{invoice.external_view_key}/view", as: :json
      expect(response.parsed_body.dig("razorpay_payment", "enabled")).to be(false)
    end

    [
      ["the connection was revoked", -> { PaymentProviders::RazorpayOauthConnection.new(provider: provider.reload, actor: nil).provider_revoked!(occurred_at: 1.minute.from_now.to_i, event_id: "evt") }],
      ["collections are switched off for the application", -> { stub_razorpay_oauth_env(COLLECTIONS_ENABLED: "false") }],
      ["the merchant was suspended", -> { PaymentProviders::RazorpayOauthConnection.new(provider: provider.reload, actor: nil).merchant_status_changed!("suspended", occurred_at: 10, event_id: "evt") }]
    ].each do |label, change|
      it "makes no merchant request when #{label}" do
        instance_exec(&change)
        allow(InvoicePayment::Checkout).to receive(:process).and_return(Struct.new(:url).new("/stripe"))
        start_payment
        expect(WebMock).not_to have_requested(:post, links_url)
        expect(provider.reload).not_to be_razorpay_collectable
      end
    end
  end

  describe "the return callback" do
    before { bound_invoice }

    it "settles only after an authenticated fetch proves the exact captured payment" do
      fetch = stub_request(:get, "#{links_url}/plink_oauth").with(headers: { "Authorization" => "Bearer synthetic-access" })
        .to_return(status: 200, body: paid_link.to_json, headers: { "Content-Type" => "application/json" })
      return_from_razorpay
      expect(fetch).to have_been_requested
      expect(invoice.reload).to be_paid
      expect(invoice.payments.last).to have_attributes(provider_event_id: "razorpay:pay_oauth", transaction_type: "razorpay")
      expect(RazorpayPayoutJob).not_to have_received(:perform_later)
    end

    it "does not call the API-key signature helper" do
      stub_fetch(paid_link)
      expect(Razorpay::Utility).not_to receive(:verify_payment_link_signature)
      return_from_razorpay
    end

    {
      "another amount" => { amount: 50_000, amount_paid: 50_000 },
      "partial settlement" => { amount_paid: 50_000 },
      "another currency" => { currency: "USD" },
      "another reference" => { reference_id: "miru-inv-999999-abcd1234" },
      "unpaid status" => { status: "created" },
      "another payment" => { payments: [{ payment_id: "pay_other", status: "captured", amount: 100_000 }] },
      "an uncaptured payment" => { payments: [{ payment_id: "pay_oauth", status: "failed", amount: 100_000 }] },
      "another company in notes" => { notes: { miru_invoice_id: "0", company_id: "0" } }
    }.each do |label, overrides|
      it "does not settle #{label}" do
        stub_fetch(paid_link(**overrides))
        return_from_razorpay
        expect(response).to have_http_status(:found)
        expect(invoice.reload).not_to be_paid
        expect(invoice.payments).to be_empty
      end
    end

    it "flags a captured payment the callback could not match" do
      invoice.update!(amount_due: 600)
      stub_fetch(paid_link)
      return_from_razorpay
      expect(invoice.reload).not_to be_paid
      expect(payment_review).to include("payment_id" => "pay_oauth", "reason" => "callback_mismatch")
    end

    it "does not flag a link from another invoice or company" do
      stub_fetch(paid_link(notes: { miru_invoice_id: "0", company_id: "0" }))
      return_from_razorpay
      expect(payment_review).to be_nil
    end

    it "throttles the unauthenticated callback that triggers provider requests" do
      request = Rack::Attack::Request.new(Rack::MockRequest.env_for("/invoices/key/payments/razorpay_success", "REMOTE_ADDR" => "203.0.113.9"))
      expect(Rack::Attack.throttles.fetch("invoice/checkout/ip").block.call(request)).to eq("203.0.113.9")
    end

    it "does not settle a link created for another merchant account" do
      bound_invoice(razorpay_payment_link_account_id: "acc_other")
      stub_fetch(paid_link)
      return_from_razorpay
      expect(invoice.reload).not_to be_paid
    end

    it "makes no request when the callback names another link" do
      return_from_razorpay(razorpay_payment_link_id: "plink_other")
      expect(a_request(:get, /payment_links/)).not_to have_been_made
      expect(invoice.reload).not_to be_paid
    end
  end

  describe "the signed application webhook" do
    before { bound_invoice }

    def event(name = "payment_link.paid", account_id: "acc_synthetic", entity: paid_link.except(:payments), payment: { id: "pay_oauth", status: "captured", amount: 100_000, currency: "INR" })
      { entity: "event", account_id:, event: name, contains: ["payment_link", "payment"], created_at: Time.current.to_i,
        payload: { payment_link: { entity: }, payment: { entity: payment } } }
    end

    it "settles once and survives a replay" do
      2.times { post_razorpay_oauth_event(event) }
      expect(response).to have_http_status(:ok)
      expect(invoice.reload).to be_paid
      expect(invoice.payments.count).to eq(1)
      expect(RazorpayPayoutJob).not_to have_received(:perform_later)
    end

    it "does not settle when another merchant forges this invoice in their own link" do
      post_razorpay_oauth_event(event(account_id: "acc_attacker"))
      expect(response).to have_http_status(:ok)
      expect(invoice.reload).not_to be_paid
    end

    it "does not settle a link Miru did not create even with this invoice in its notes" do
      post_razorpay_oauth_event(event(entity: paid_link.except(:payments).merge(id: "plink_merchant_own")))
      expect(response).to have_http_status(:ok)
      expect(invoice.reload).not_to be_paid
    end

    {
      "an amount mismatch" => { payment: { id: "pay_oauth", status: "captured", amount: 1, currency: "INR" } },
      "a currency mismatch" => { payment: { id: "pay_oauth", status: "captured", amount: 100_000, currency: "USD" } },
      "an uncaptured payment" => { payment: { id: "pay_oauth", status: "failed", amount: 100_000, currency: "INR" } },
      "a missing payment" => { payment: {} }
    }.each do |label, overrides|
      it "does not settle #{label}" do
        post_razorpay_oauth_event(event(**overrides))
        expect(response).to have_http_status(:ok)
        expect(invoice.reload).not_to be_paid
        expect(invoice.payments).to be_empty
      end
    end

    it "surfaces a captured payment for an edited invoice instead of dropping it silently" do
      invoice.update!(amount_due: 600)
      post_razorpay_oauth_event(event)
      expect(response).to have_http_status(:ok)
      expect(invoice.reload).not_to be_paid
      expect(payment_review).to include("payment_id" => "pay_oauth", "reason" => "webhook_mismatch", "amount" => 100_000)
      expect(razorpay_oauth_status(provider)[:payments_needing_review].first).to include(invoice_id: invoice.id)
    end

    it "surfaces a capture on a link Miru no longer tracks for this merchant" do
      post_razorpay_oauth_event(event(entity: paid_link.except(:payments).merge(id: "plink_replaced")))
      expect(invoice.reload).not_to be_paid
      expect(payment_review).to include("payment_link_id" => "plink_replaced", "reason" => "untracked_link")
    end

    it "ignores another merchant claiming this invoice in link notes" do
      post_razorpay_oauth_event(event(account_id: "acc_attacker", entity: paid_link.except(:payments).merge(id: "plink_attacker")))
      expect(response).to have_http_status(:ok)
      expect(payment_review).to be_nil
    end

    it "does not process an OAuth invoice through the legacy endpoint with a stale saved secret" do
      record = provider.reload
      record.webhook_secret = "stale-secret"
      record.save!
      raw = event.to_json
      post "/webhooks/razorpay/payment_links", params: raw, headers: {
        "CONTENT_TYPE" => "application/json", "X-Razorpay-Signature" => OpenSSL::HMAC.hexdigest("SHA256", "stale-secret", raw)
      }
      expect(response).to have_http_status(:unprocessable_content)
      expect(invoice.reload).not_to be_paid
    end

    it "does not settle a partial payment" do
      post_razorpay_oauth_event(event("payment_link.partially_paid", entity: paid_link.except(:payments).merge(status: "partially_paid", amount_paid: 10)))
      expect(response).to have_http_status(:ok)
      expect(invoice.reload).not_to be_paid
    end

    it "clears an expired link" do
      post_razorpay_oauth_event(event("payment_link.expired", entity: link.merge(status: "expired")))
      expect(invoice.reload.razorpay_payment_link_id).to be_nil
    end

    it "reconciles a delayed paid event after the merchant disconnected" do
      stub_request(:post, RazorpayOauthHelpers::REVOKE_URL).to_return(status: 200, body: { message: "Token Revoked" }.to_json)
      PaymentProviders::RazorpayOauthConnection.new(provider: provider.reload, actor: owner).disconnect!
      post_razorpay_oauth_event(event)
      expect(invoice.reload).to be_paid
    end
  end
end

RSpec.describe "Razorpay OAuth account webhooks", type: :request do
  let(:company) { create(:company) }
  let(:owner) { create(:user, current_workspace: company) }
  let!(:employment) { create(:employment, company:, user: owner, resigned_at: nil) }
  let(:provider) { create(:payments_provider, company:, name: "razorpay", settings: { platform_fee_percent: "0" }) }
  let(:revocation) { { event: "account.app.authorization_revoked", account_id: "acc_synthetic", contains: [], created_at: 1.minute.from_now.to_i } }

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
    stub_razorpay_oauth_env
    connect_razorpay_oauth(provider, owner)
  end

  it "rejects an empty unsigned body without an error" do
    post "/webhooks/razorpay/oauth", headers: { "CONTENT_TYPE" => "application/json" }
    expect(response).to have_http_status(:unauthorized)
  end

  it "does not apply status for an unverified account typed into recovery" do
    record = provider.reload
    record.settings["oauth_recovery"] = { "account_id" => "acc_typed", "requested_at" => 1 }
    record.save!
    post_razorpay_oauth_event({ event: "account.activated", account_id: "acc_typed", created_at: 100 })
    expect(response).to have_http_status(:ok)
    expect(provider.reload.settings).not_to have_key("oauth_merchant_status")
  end

  it "ignores an activation event whose payload says the account is not activated" do
    post_razorpay_oauth_event({ event: "account.activated", account_id: "acc_synthetic", created_at: 100,
      payload: { account: { entity: { activated: false, live: false } } } })
    expect(response).to have_http_status(:ok)
    expect(provider.reload.settings).not_to have_key("oauth_merchant_status")
  end

  it "rejects a missing secret, a bad signature and a body that was changed after signing" do
    stub_razorpay_oauth_env(WEBHOOK_SECRET: "")
    post_razorpay_oauth_event(revocation, secret: "any")
    expect(response).to have_http_status(:unprocessable_content)
    stub_razorpay_oauth_env
    post_razorpay_oauth_event(revocation, secret: "wrong-secret")
    expect(response).to have_http_status(:unauthorized)
    post_razorpay_oauth_event(revocation, signature: "")
    expect(response).to have_http_status(:unauthorized)
    expect(razorpay_oauth_status(provider)).to include(status: "connected")
  end

  it "does not accept a public token or the OAuth client secret as the webhook key" do
    ["rzp_test_oauth_synthetic", "synthetic-secret"].each do |key|
      post_razorpay_oauth_event(revocation, secret: key)
      expect(response).to have_http_status(:unauthorized)
    end
    expect(razorpay_oauth_status(provider)).to include(status: "connected")
  end

  it "revokes the matching connection, audits only identifiers, and stops token use" do
    post_razorpay_oauth_event(revocation, event_id: "evt_revoke")
    expect(response).to have_http_status(:ok)
    expect(razorpay_oauth_status(provider)).to include(status: "revoked", collections_ready: false)
    expect(provider.settings).not_to have_key("razorpay_oauth_credentials_ciphertext")
    audit = Audited::Audit.find_by!(auditable: provider, action: "razorpay_oauth_provider_revoked")
    expect(audit.audited_changes).to include("account_id" => "acc_synthetic", "event_id" => "evt_revoke")
    expect(audit.audited_changes.to_json).not_to include("synthetic-access", "synthetic-refresh", "contains")
  end

  it "ignores a replayed revocation from before the current connection" do
    post_razorpay_oauth_event(revocation.merge(created_at: 1.day.ago.to_i))
    expect(response).to have_http_status(:ok)
    expect(razorpay_oauth_status(provider)).to include(status: "connected")
  end

  it "does not touch another account, application or mode" do
    other_company = create(:company)
    other = create(:payments_provider, company: other_company, name: "razorpay", settings: {
      platform_fee_percent: "0", authentication_mode: "oauth", oauth_status: "connected", oauth_account_id: "acc_other",
      oauth_client_id: "synthetic-client", oauth_mode: "test"
    })
    other_app = create(:payments_provider, company: create(:company), name: "razorpay", settings: {
      platform_fee_percent: "0", authentication_mode: "oauth", oauth_status: "connected", oauth_account_id: "acc_synthetic",
      oauth_client_id: "another-client", oauth_mode: "test"
    })
    other_mode = create(:payments_provider, company: create(:company), name: "razorpay", settings: {
      platform_fee_percent: "0", authentication_mode: "oauth", oauth_status: "connected", oauth_account_id: "acc_synthetic",
      oauth_client_id: "synthetic-client", oauth_mode: "live"
    })
    post_razorpay_oauth_event(revocation)
    expect([other, other_app, other_mode].map { |record| record.reload.settings["oauth_status"] }).to all(eq("connected"))
    expect(razorpay_oauth_status(provider)).to include(status: "revoked")
  end

  it "does not revoke an API-key provider sharing a merchant id in its settings" do
    legacy = create(:payments_provider, company: create(:company), name: "razorpay", settings: {
      platform_fee_percent: "0", key_id: "rzp_test_key", oauth_account_id: "acc_synthetic", oauth_client_id: "synthetic-client", oauth_mode: "test"
    })
    previous = legacy.reload.settings.deep_dup
    post_razorpay_oauth_event(revocation)
    expect(legacy.reload.settings).to eq(previous)
  end

  it "records merchant status changes in order" do
    post_razorpay_oauth_event({ event: "account.under_review", account_id: "acc_synthetic", created_at: 200 })
    expect(razorpay_oauth_status(provider)).to include(merchant_status: "under_review", collections_blocker: "merchant_under_review")
    post_razorpay_oauth_event({ event: "account.activated", account_id: "acc_synthetic", created_at: 100 })
    expect(razorpay_oauth_status(provider)).to include(merchant_status: "under_review")
    post_razorpay_oauth_event({ event: "account.activated", account_id: "acc_synthetic", created_at: 300 })
    expect(razorpay_oauth_status(provider)).to include(merchant_status: "activated", collections_blocker: nil)
  end

  it "acknowledges unrelated events and rejects malformed account events" do
    post_razorpay_oauth_event({ event: "payment.captured", account_id: "acc_synthetic", created_at: 1 })
    expect(response).to have_http_status(:ok)
    post_razorpay_oauth_event({ event: "account.activated", account_id: "not-an-account", created_at: 1 })
    expect(response).to have_http_status(:unprocessable_content)
    post_razorpay_oauth_event({ event: "account.activated", account_id: "acc_synthetic", created_at: "yesterday" })
    expect(response).to have_http_status(:unprocessable_content)
    post_razorpay_oauth_event("not json")
    expect(response).to have_http_status(:unprocessable_content)
    post_razorpay_oauth_event("[1]")
    expect(response).to have_http_status(:ok)
  end

  it "keeps payouts unavailable to a merchant OAuth provider" do
    expect { PaymentProviders::RazorpayClient.new(provider: provider.reload).create_upi_payout({ amount: 1 }, idempotency_key: "key") }
      .to raise_error(PaymentProviders::RazorpayClient::Error, /key id and key secret/)
    expect(a_request(:post, %r{api\.razorpay\.com/v1/payouts})).not_to have_been_made
  end
end

RSpec.describe PaymentProviders::RazorpayPaymentLinkService, "concurrent OAuth link creation" do
  let(:company) { create(:india_company, base_currency: "INR") }
  let(:owner) { create(:user, current_workspace: company) }
  let(:client) { create(:client, company:, currency: "INR", name: "Acme", email: "client@example.com") }
  let(:invoice) { create(:invoice, company:, client:, currency: "INR", amount: 1000, amount_due: 1000, amount_paid: 0, status: "sent", payment_infos: {}) }
  let(:provider) { create(:payments_provider, company:, name: "razorpay", settings: { platform_fee_percent: "0" }) }
  let(:links_url) { "https://api.razorpay.com/v1/payment_links" }
  let(:link) do
    { id: "plink_only", short_url: "https://rzp.io/rzp/only", status: "created", amount: 100_000, amount_paid: 0, currency: "INR",
      reference_id: "miru-inv-#{invoice.id}-abcd1234", notes: { miru_invoice_id: invoice.id.to_s, company_id: company.id.to_s } }
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
    DatabaseCleaner.clean
    DatabaseCleaner.strategy = :deletion, { except: %w[ar_internal_metadata schema_migrations] }
    create(:employment, company:, user: owner, resigned_at: nil)
    owner.add_role(:owner, company)
    stub_razorpay_oauth_env
    connect_razorpay_oauth(provider, owner)
    @threads = []
  end

  after do
    @threads.each { |thread| thread.kill if thread.alive? }
    @threads.each(&:join)
  end

  def create_link_in_thread(label = nil)
    invoice_id, provider_id, url = invoice.id, provider.id, "https://example.com/callback"
    @threads << Thread.new do
      Thread.current.report_on_exception = false
      ActiveRecord::Base.connection_pool.with_connection do |database|
        database.execute("SET application_name = #{database.quote(label)}") if label
        described_class.new(invoice: Invoice.find(invoice_id), provider: PaymentsProvider.find(provider_id), callback_url: url).process
      ensure
        database.execute("RESET application_name")
      end
    end
    @threads.last
  end

  it "creates one payable link when two requests race" do
    entered, release = Queue.new, Queue.new
    stub_request(:post, links_url).to_return do
      entered << true
      release.pop
      { status: 200, body: link.to_json, headers: { "Content-Type" => "application/json" } }
    end
    stub_request(:get, "#{links_url}/plink_only").to_return(status: 200, body: link.to_json, headers: { "Content-Type" => "application/json" })

    first = create_link_in_thread
    Timeout.timeout(5) { entered.pop }
    second = create_link_in_thread("miru_oauth_second_link")
    Timeout.timeout(5) do
      loop do
        break if ActiveRecord::Base.connection.select_value(
          "SELECT EXISTS(SELECT 1 FROM pg_stat_activity WHERE application_name = 'miru_oauth_second_link' AND wait_event_type = 'Lock')")

        Thread.pass
      end
    end
    release << true
    expect(Timeout.timeout(5) { [first.value, second.value] }).to eq(["https://rzp.io/rzp/only", "https://rzp.io/rzp/only"])
    expect(a_request(:post, links_url)).to have_been_made.once
    expect(invoice.reload.razorpay_payment_link_id).to eq("plink_only")
  ensure
    release << true
  end
end
