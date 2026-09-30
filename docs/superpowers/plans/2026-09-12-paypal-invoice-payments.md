# PayPal Invoice Payments Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let a Miru workspace connect its own PayPal REST app and let clients pay invoices through PayPal, with capture on return and webhook reconciliation.

**Architecture:** PayPal becomes a fourth `PaymentsProvider` (`name: "paypal"`) alongside Stripe, UPI, and Razorpay. A small Faraday client talks to PayPal Orders v2 and Webhooks v1 with merchant credentials stored encrypted in `settings`. The public `Invoices::PaymentsController` creates an order and redirects the buyer; `paypal_return` captures and settles through the existing `InvoicePayment::Settle`; a new `Webhooks::PaypalController` reconciles `PAYMENT.CAPTURE.COMPLETED` and `CHECKOUT.ORDER.APPROVED`.

**Tech Stack:** Rails 8, Faraday (already in Gemfile), RSpec + WebMock, React/TypeScript settings page, Vite.

Spec: `docs/superpowers/specs/2026-09-12-paypal-invoice-payments-design.md`

Repo rules that apply: run focused specs for files you change; `rtk mise exec -- bundle exec rspec <path>` for Ruby; `rtk mise exec -- timeout 30 bin/vite build` after every JS/TS change; conventional commit subjects; no code comments unless the WHY is non-obvious; files end with a newline.

---

## File map

Create:
- `app/services/payment_providers/paypal_client.rb` — HTTP client (token, orders, webhooks, signature verification)
- `app/services/payment_providers/paypal_amount.rb` — currency support list and amount formatting
- `app/services/payment_providers/paypal_connection_service.rb` — verify credentials, register/delete webhook, persist provider
- `app/services/payment_providers/paypal_order_service.rb` — create order for an invoice, return approval URL
- `app/services/invoice_payment/paypal_capture_fulfillment.rb` — capture + settle, idempotent
- `app/services/invoice_payment/paypal_webhook_fulfillment.rb` — parse, verify, delegate to capture fulfillment
- `app/controllers/webhooks/paypal_controller.rb`
- `docs/product-guide/payments/04-paypal.md`
- specs for each of the above plus request specs

Modify:
- `app/models/payments_provider.rb` — `PAYPAL_PROVIDER`, `encrypted_setting` macro, paypal accessors/validations
- `app/models/invoice.rb:47-52` — `paypal_order_id`, `paypal_order_status`, `paypal_capture_id` store accessors
- `app/controllers/api/v1/payment_settings_controller.rb` — `update_paypal`, `disconnect_paypal`, `paypal_provider`, locals
- `app/policies/payment_settings_policy.rb` — `update_paypal?`, `disconnect_paypal?`
- `app/views/api/v1/payment_settings/index.json.jbuilder` — `providers.paypal`
- `app/views/api/v1/invoices/view/show.json.jbuilder` — `paypal_payment`
- `app/controllers/invoices/payments_controller.rb` — provider selection, `paypal_return`
- `config/routes.rb:60-66,78-82` — `paypal_return` collection route, `webhooks/paypal/events`
- `config/routes/api.rb:209-210` — `patch/delete payments/settings/paypal`
- `app/javascript/src/apis/api.ts:417-426` — `updatePaypal`, `disconnectPaypal`
- `app/javascript/src/components/Profile/Organization/Payment/Page.tsx` — PayPal card
- `app/javascript/src/components/ClientInvoices/Details/index.tsx`, `Header.tsx`, `MobileView/index.tsx` — Pay with PayPal
- `app/javascript/src/components/Invoices/List/index.tsx:256-270` — PayPal counts as a payment provider
- `app/javascript/src/i18n/locales/en.ts` (`paymentSettingsPage` block near line 1730, `invoices` block) — new keys
- `CHANGELOG.md` — Unreleased / Added

---

### Task 1: PaymentsProvider model support for PayPal

**Files:**
- Modify: `app/models/payments_provider.rb`
- Modify: `app/models/invoice.rb:47-52`
- Test: `spec/models/payments_provider_spec.rb`

- [ ] **Step 1: Write the failing model specs**

Append to `spec/models/payments_provider_spec.rb` inside the top-level `describe PaymentsProvider` block:

```ruby
  describe "PayPal" do
    subject(:provider) do
      build(
        :payments_provider,
        name: PaymentsProvider::PAYPAL_PROVIDER,
        enabled: enabled,
        connected: connected,
        settings: { client_id: client_id, environment: "sandbox" }
      )
    end

    let(:enabled) { false }
    let(:connected) { false }
    let(:client_id) { "AZ-client-id" }

    it "stores the client secret encrypted and reads it back" do
      provider.client_secret = "shh"

      expect(provider.settings["client_secret"]).to be_nil
      expect(provider.settings["client_secret_ciphertext"]).to be_present
      expect(provider.client_secret).to eq("shh")
      expect(provider.paypal_configured?).to be(true)
    end

    it "keeps the stored secret when assigned a blank value" do
      provider.client_secret = "shh"
      provider.client_secret = ""

      expect(provider.client_secret).to eq("shh")
    end

    it "defaults the environment to live" do
      provider.settings.delete("environment")

      expect(provider.paypal_environment).to eq("live")
      expect(provider.paypal_sandbox?).to be(false)
    end

    it "rejects unknown environments" do
      provider.environment = "staging"

      expect(provider).not_to be_valid
      expect(provider.errors[:environment]).to be_present
    end

    context "when enabled without verified credentials" do
      let(:enabled) { true }

      it "is invalid" do
        provider.client_secret = "shh"

        expect(provider).not_to be_valid
        expect(provider.errors[:base]).to include("Connect PayPal before enabling it")
      end
    end

    context "when enabled and connected" do
      let(:enabled) { true }
      let(:connected) { true }

      it "is valid" do
        provider.client_secret = "shh"

        expect(provider).to be_valid
      end
    end
  end

  describe ".paypal_currency_supported?" do
    it "accepts PayPal currencies case-insensitively" do
      expect(described_class.paypal_currency_supported?("usd")).to be(true)
      expect(described_class.paypal_currency_supported?("EUR")).to be(true)
    end

    it "rejects unsupported currencies" do
      expect(described_class.paypal_currency_supported?("INR")).to be(false)
      expect(described_class.paypal_currency_supported?(nil)).to be(false)
    end
  end
```

Also update the inclusion expectation:

```ruby
      it { is_expected.to validate_inclusion_of(:name).in_array(%w(stripe upi razorpay paypal)) }
```

- [ ] **Step 2: Run to verify failure**

Run: `rtk mise exec -- bundle exec rspec spec/models/payments_provider_spec.rb`
Expected: failures for `PAYPAL_PROVIDER`, `client_secret`, `paypal_environment`, `paypal_currency_supported?`.

- [ ] **Step 3: Implement in the model**

In `app/models/payments_provider.rb`:

```ruby
  PAYPAL_PROVIDER = "paypal"
  PROVIDERS = [STRIPE_PROVIDER, UPI_PROVIDER, RAZORPAY_PROVIDER, PAYPAL_PROVIDER].freeze
  PAYPAL_ENVIRONMENTS = %w[sandbox live].freeze
  PAYPAL_CURRENCIES = %w[
    AUD BRL CAD CNY CZK DKK EUR HKD HUF ILS JPY MYR MXN TWD NZD NOK PHP PLN GBP RUB SGD SEK CHF THB USD
  ].freeze
  PAYPAL_ZERO_DECIMAL_CURRENCIES = %w[HUF JPY TWD].freeze
```

Add to `store_accessor :settings`: `:client_id, :environment, :webhook_id, :webhook_client_id, :webhook_environment, :webhook_error`.

Replace the hand-written `key_secret`/`key_secret=`/`webhook_secret`/`webhook_secret=` methods with a class macro that defines the same behavior (ciphertext key `"#{name}_ciphertext"`, plaintext fallback `settings[name]`, blank assignment keeps the stored value, assignment deletes the plaintext key):

```ruby
  def self.encrypted_setting(*names)
    names.each do |name|
      define_method(name) do
        ciphertext = settings&.dig("#{name}_ciphertext")
        return decrypt_setting(ciphertext) if ciphertext.present?

        settings&.dig(name.to_s)
      end

      define_method("#{name}=") do |value|
        ensure_settings
        return if value.blank?

        settings.delete(name.to_s)
        settings["#{name}_ciphertext"] = encrypt_setting(value)
      end
    end
  end

  encrypted_setting :key_secret, :webhook_secret, :client_secret
```

Rename the private `encrypt_key_secret`/`decrypt_key_secret` to `encrypt_setting`/`decrypt_setting`. Keep `key_secret_encryptor` and the key name `"payments_provider_key_secret"` unchanged so existing Razorpay secrets still decrypt.

Add:

```ruby
  before_validation :normalize_paypal_settings, if: :paypal?
  validates :client_id, length: { maximum: 200 }, allow_blank: true, if: :paypal?
  validates :environment, inclusion: { in: PAYPAL_ENVIRONMENTS }, allow_blank: true, if: :paypal?
  validate :paypal_enabled_requires_connection, if: :paypal?

  def self.paypal_currency_supported?(currency)
    PAYPAL_CURRENCIES.include?(currency.to_s.upcase)
  end

  def paypal?
    name == PAYPAL_PROVIDER
  end

  def paypal_configured?
    paypal? && client_id.present? && client_secret.present?
  end

  def paypal_environment
    environment.presence || "live"
  end

  def paypal_sandbox?
    paypal_environment == "sandbox"
  end

  private

    def normalize_paypal_settings
      self.client_id = client_id.to_s.strip
      self.environment = environment.to_s.strip.downcase.presence
    end

    def paypal_enabled_requires_connection
      return unless enabled? && !(paypal_configured? && connected?)

      errors.add(:base, "Connect PayPal before enabling it")
    end
```

In `app/models/invoice.rb` extend the store accessor list:

```ruby
  store_accessor :payment_infos,
    :stripe_payment_intent,
    :razorpay_payment_link_id,
    :razorpay_payment_link_url,
    :razorpay_payment_link_status,
    :razorpay_payment_id,
    :paypal_order_id,
    :paypal_order_status,
    :paypal_capture_id
```

- [ ] **Step 4: Run model specs**

Run: `rtk mise exec -- bundle exec rspec spec/models/payments_provider_spec.rb spec/models/invoice_spec.rb spec/services/payment_providers/razorpay_client_spec.rb`
Expected: all pass (Razorpay secret behavior unchanged).

- [ ] **Step 5: Commit**

```bash
git add app/models/payments_provider.rb app/models/invoice.rb spec/models/payments_provider_spec.rb
git commit -m "feat(payments): add PayPal provider settings to PaymentsProvider"
```

---

### Task 2: PayPal amount helper and HTTP client

**Files:**
- Create: `app/services/payment_providers/paypal_amount.rb`
- Create: `app/services/payment_providers/paypal_client.rb`
- Test: `spec/services/payment_providers/paypal_amount_spec.rb`
- Test: `spec/services/payment_providers/paypal_client_spec.rb`

- [ ] **Step 1: Write failing specs**

`spec/services/payment_providers/paypal_amount_spec.rb`:

```ruby
# frozen_string_literal: true

require "rails_helper"

RSpec.describe PaymentProviders::PaypalAmount do
  it "formats two-decimal currencies as strings" do
    expect(described_class.format(BigDecimal("1234.5"), "USD")).to eq("1234.50")
  end

  it "formats zero-decimal currencies without decimals" do
    expect(described_class.format(BigDecimal("1234.6"), "JPY")).to eq("1235")
  end

  it "parses PayPal amounts to BigDecimal" do
    expect(described_class.parse("10.25")).to eq(BigDecimal("10.25"))
  end
end
```

`spec/services/payment_providers/paypal_client_spec.rb` (WebMock is enabled globally in `spec/spec_helper.rb`):

```ruby
# frozen_string_literal: true

require "rails_helper"

RSpec.describe PaymentProviders::PaypalClient do
  let(:provider) do
    build(
      :payments_provider,
      name: PaymentsProvider::PAYPAL_PROVIDER,
      settings: { client_id: "client-id", environment: "sandbox" }
    ).tap { |record| record.client_secret = "client-secret" }
  end
  let(:client) { described_class.new(provider:) }
  let(:base_url) { "https://api-m.sandbox.paypal.com" }

  before do
    Rails.cache.clear
    stub_request(:post, "#{base_url}/v1/oauth2/token")
      .with(basic_auth: ["client-id", "client-secret"], body: { grant_type: "client_credentials" })
      .to_return(status: 200, body: { access_token: "token-1", expires_in: 3600 }.to_json, headers: { "Content-Type" => "application/json" })
  end

  it "uses the live base URL outside sandbox" do
    provider.environment = "live"

    expect(client.base_url).to eq("https://api-m.paypal.com")
  end

  it "fetches and caches the access token" do
    expect(client.access_token).to eq("token-1")
    expect(described_class.new(provider:).access_token).to eq("token-1")
    expect(a_request(:post, "#{base_url}/v1/oauth2/token")).to have_been_made.once
  end

  it "raises a readable error for bad credentials" do
    stub_request(:post, "#{base_url}/v1/oauth2/token")
      .to_return(status: 401, body: { error: "invalid_client", error_description: "Client Authentication failed" }.to_json)

    expect { client.access_token }.to raise_error(described_class::Error, "Client Authentication failed")
  end

  it "creates orders with an idempotency header" do
    stub_request(:post, "#{base_url}/v2/checkout/orders")
      .with(headers: { "Authorization" => "Bearer token-1", "PayPal-Request-Id" => "req-1" }, body: { intent: "CAPTURE" }.to_json)
      .to_return(status: 201, body: { id: "ORDER-1", status: "PAYER_ACTION_REQUIRED" }.to_json, headers: { "Content-Type" => "application/json" })

    expect(client.create_order({ intent: "CAPTURE" }, request_id: "req-1")).to include("id" => "ORDER-1")
  end

  it "captures orders" do
    stub_request(:post, "#{base_url}/v2/checkout/orders/ORDER-1/capture")
      .with(headers: { "PayPal-Request-Id" => "cap-1" })
      .to_return(status: 201, body: { id: "ORDER-1", status: "COMPLETED" }.to_json, headers: { "Content-Type" => "application/json" })

    expect(client.capture_order("ORDER-1", request_id: "cap-1")).to include("status" => "COMPLETED")
  end

  it "exposes the PayPal issue code on API errors" do
    stub_request(:post, "#{base_url}/v2/checkout/orders/ORDER-1/capture")
      .to_return(status: 422, body: { name: "UNPROCESSABLE_ENTITY", message: "The requested action could not be performed.", details: [{ issue: "ORDER_ALREADY_CAPTURED", description: "Order already captured." }] }.to_json)

    expect { client.capture_order("ORDER-1", request_id: "cap-1") }.to raise_error(described_class::Error) { |error|
      expect(error.issue).to eq("ORDER_ALREADY_CAPTURED")
      expect(error.message).to eq("Order already captured.")
    }
  end

  it "registers webhooks" do
    stub_request(:post, "#{base_url}/v1/notifications/webhooks")
      .with(body: { url: "https://app.miru.so/webhooks/paypal/events", event_types: [{ name: "PAYMENT.CAPTURE.COMPLETED" }, { name: "CHECKOUT.ORDER.APPROVED" }] }.to_json)
      .to_return(status: 201, body: { id: "WH-1" }.to_json, headers: { "Content-Type" => "application/json" })

    expect(client.create_webhook(url: "https://app.miru.so/webhooks/paypal/events")).to include("id" => "WH-1")
  end

  it "lists and deletes webhooks" do
    stub_request(:get, "#{base_url}/v1/notifications/webhooks")
      .to_return(status: 200, body: { webhooks: [{ id: "WH-1", url: "https://app.miru.so/webhooks/paypal/events" }] }.to_json, headers: { "Content-Type" => "application/json" })
    stub_request(:delete, "#{base_url}/v1/notifications/webhooks/WH-1").to_return(status: 204, body: "")

    expect(client.list_webhooks.first["id"]).to eq("WH-1")
    expect(client.delete_webhook("WH-1")).to eq({})
  end

  it "verifies webhook signatures" do
    headers = {
      "PAYPAL-AUTH-ALGO" => "SHA256withRSA",
      "PAYPAL-CERT-URL" => "https://api.sandbox.paypal.com/v1/notifications/certs/CERT-1",
      "PAYPAL-TRANSMISSION-ID" => "tid-1",
      "PAYPAL-TRANSMISSION-SIG" => "sig-1",
      "PAYPAL-TRANSMISSION-TIME" => "2026-09-12T10:00:00Z"
    }
    body = { id: "WH-EVT-1", event_type: "PAYMENT.CAPTURE.COMPLETED" }.to_json
    stub_request(:post, "#{base_url}/v1/notifications/verify-webhook-signature")
      .with(body: {
        auth_algo: "SHA256withRSA",
        cert_url: "https://api.sandbox.paypal.com/v1/notifications/certs/CERT-1",
        transmission_id: "tid-1",
        transmission_sig: "sig-1",
        transmission_time: "2026-09-12T10:00:00Z",
        webhook_id: "WH-1",
        webhook_event: JSON.parse(body)
      }.to_json)
      .to_return(status: 200, body: { verification_status: "SUCCESS" }.to_json, headers: { "Content-Type" => "application/json" })

    expect(client.verify_webhook_signature(headers:, body:, webhook_id: "WH-1")).to be(true)
  end

  it "raises when the provider has no credentials" do
    provider.settings = { client_id: "" }

    expect { client.access_token }.to raise_error(described_class::Error, "PayPal client ID and secret are required")
  end
end
```

- [ ] **Step 2: Run to verify failure**

Run: `rtk mise exec -- bundle exec rspec spec/services/payment_providers/paypal_amount_spec.rb spec/services/payment_providers/paypal_client_spec.rb`
Expected: NameError for both classes.

- [ ] **Step 3: Implement**

`app/services/payment_providers/paypal_amount.rb`:

```ruby
# frozen_string_literal: true

module PaymentProviders
  class PaypalAmount
    def self.format(amount, currency)
      value = BigDecimal(amount.to_s)
      if PaymentsProvider::PAYPAL_ZERO_DECIMAL_CURRENCIES.include?(currency.to_s.upcase)
        value.round(0).to_i.to_s
      else
        value.round(2).to_s("F").then { |text| text.include?(".") ? text.ljust(text.index(".") + 3, "0") : "#{text}.00" }
      end
    end

    def self.parse(value)
      BigDecimal(value.to_s)
    end
  end
end
```

`app/services/payment_providers/paypal_client.rb`:

```ruby
# frozen_string_literal: true

module PaymentProviders
  class PaypalClient
    SANDBOX_BASE_URL = "https://api-m.sandbox.paypal.com"
    LIVE_BASE_URL = "https://api-m.paypal.com"
    WEBHOOK_EVENT_TYPES = ["PAYMENT.CAPTURE.COMPLETED", "CHECKOUT.ORDER.APPROVED"].freeze
    SIGNATURE_HEADERS = {
      auth_algo: "PAYPAL-AUTH-ALGO",
      cert_url: "PAYPAL-CERT-URL",
      transmission_id: "PAYPAL-TRANSMISSION-ID",
      transmission_sig: "PAYPAL-TRANSMISSION-SIG",
      transmission_time: "PAYPAL-TRANSMISSION-TIME"
    }.freeze
    REQUEST_OPEN_TIMEOUT = 5
    REQUEST_TIMEOUT = 15
    TOKEN_CACHE_MARGIN = 60

    class Error < StandardError
      attr_reader :issue, :status

      def initialize(message, issue: nil, status: nil)
        super(message)
        @issue = issue
        @status = status
      end
    end

    attr_reader :provider

    def initialize(provider:)
      @provider = provider
    end

    def base_url
      provider.paypal_sandbox? ? SANDBOX_BASE_URL : LIVE_BASE_URL
    end

    def access_token
      raise Error, "PayPal client ID and secret are required" unless provider.paypal_configured?

      Rails.cache.read(token_cache_key) || fetch_access_token
    end

    def create_order(payload, request_id:)
      post("/v2/checkout/orders", payload, headers: { "PayPal-Request-Id" => request_id, "Prefer" => "return=representation" })
    end

    def show_order(order_id)
      get("/v2/checkout/orders/#{order_id}")
    end

    def capture_order(order_id, request_id:)
      post("/v2/checkout/orders/#{order_id}/capture", {}, headers: { "PayPal-Request-Id" => request_id, "Prefer" => "return=representation" })
    end

    def create_webhook(url:, event_types: WEBHOOK_EVENT_TYPES)
      post("/v1/notifications/webhooks", { url:, event_types: event_types.map { |name| { name: } } })
    end

    def list_webhooks
      Array(get("/v1/notifications/webhooks")["webhooks"])
    end

    def delete_webhook(webhook_id)
      request(:delete, "/v1/notifications/webhooks/#{webhook_id}")
    end

    def verify_webhook_signature(headers:, body:, webhook_id:)
      payload = SIGNATURE_HEADERS.transform_values { |header| headers[header].to_s }
      payload[:webhook_id] = webhook_id
      payload[:webhook_event] = JSON.parse(body)
      response = post("/v1/notifications/verify-webhook-signature", payload)
      response["verification_status"] == "SUCCESS"
    rescue JSON::ParserError
      false
    end

    private

      def get(path)
        request(:get, path)
      end

      def post(path, payload, headers: {})
        request(:post, path, body: JSON.generate(payload), headers:)
      end

      def request(method, path, body: nil, headers: {}, retry_on_unauthorized: true)
        response = http.run_request(method, path, body, headers.merge("Authorization" => "Bearer #{access_token}"))
        if response.status == 401 && retry_on_unauthorized
          Rails.cache.delete(token_cache_key)
          return request(method, path, body:, headers:, retry_on_unauthorized: false)
        end

        parsed_response(response)
      rescue Faraday::Error => error
        raise Error.new("PayPal request failed: #{error.class.name.demodulize}")
      end

      def fetch_access_token
        response = Faraday.new(url: base_url, request: timeout_options) do |faraday|
          faraday.request :url_encoded
          faraday.request :authorization, :basic, provider.client_id, provider.client_secret
          faraday.headers["Accept"] = "application/json"
        end.post("/v1/oauth2/token", grant_type: "client_credentials")

        body = parsed_response(response)
        token = body.fetch("access_token")
        ttl = [body["expires_in"].to_i - TOKEN_CACHE_MARGIN, TOKEN_CACHE_MARGIN].max
        Rails.cache.write(token_cache_key, token, expires_in: ttl.seconds)
        token
      rescue Faraday::Error => error
        raise Error.new("PayPal request failed: #{error.class.name.demodulize}")
      end

      def http
        Faraday.new(url: base_url, request: timeout_options) do |faraday|
          faraday.headers["Accept"] = "application/json"
          faraday.headers["Content-Type"] = "application/json"
        end
      end

      def timeout_options
        { open_timeout: REQUEST_OPEN_TIMEOUT, timeout: REQUEST_TIMEOUT }
      end

      def token_cache_key
        "paypal:access_token:#{provider.paypal_environment}:#{Digest::SHA256.hexdigest(provider.client_id.to_s)}"
      end

      def parsed_response(response)
        body = response.body.present? ? JSON.parse(response.body) : {}
        return body if response.success?

        detail = Array(body["details"]).first || {}
        message = detail["description"].presence ||
          body["error_description"].presence ||
          body["message"].presence ||
          body["error"].presence ||
          "PayPal API request failed"
        raise Error.new(message, issue: detail["issue"].presence || body["name"].presence, status: response.status)
      rescue JSON::ParserError
        raise Error.new("PayPal API returned an invalid response", status: response.status)
      end
  end
end
```

- [ ] **Step 4: Run specs**

Run: `rtk mise exec -- bundle exec rspec spec/services/payment_providers/paypal_amount_spec.rb spec/services/payment_providers/paypal_client_spec.rb`
Expected: PASS. Note `Rails.cache` in test may be `:null_store`; if the caching example fails for that reason, wrap that example with `Rails.cache = ActiveSupport::Cache::MemoryStore.new` in an `around` block.

- [ ] **Step 5: Commit**

```bash
git add app/services/payment_providers/paypal_amount.rb app/services/payment_providers/paypal_client.rb spec/services/payment_providers/paypal_amount_spec.rb spec/services/payment_providers/paypal_client_spec.rb
git commit -m "feat(payments): add PayPal REST client"
```

---

### Task 3: Connection service (verify credentials, register webhook)

**Files:**
- Create: `app/services/payment_providers/paypal_connection_service.rb`
- Test: `spec/services/payment_providers/paypal_connection_service_spec.rb`

- [ ] **Step 1: Write failing specs**

```ruby
# frozen_string_literal: true

require "rails_helper"

RSpec.describe PaymentProviders::PaypalConnectionService do
  let(:company) { create(:company) }
  let(:provider) do
    build(
      :payments_provider,
      company:,
      name: PaymentsProvider::PAYPAL_PROVIDER,
      enabled: true,
      accepted_payment_methods: ["paypal"],
      settings: { client_id: "client-id", environment: "sandbox", enabled_on_invoices: true }
    ).tap { |record| record.client_secret = "client-secret" }
  end
  let(:client) { instance_double(PaymentProviders::PaypalClient) }
  let(:webhook_url) { "https://app.miru.so/webhooks/paypal/events" }
  let(:service) { described_class.new(provider:, webhook_url:) }

  before do
    allow(PaymentProviders::PaypalClient).to receive(:new).with(provider:).and_return(client)
  end

  it "verifies credentials, registers the webhook and saves the provider as connected" do
    allow(client).to receive(:access_token).and_return("token")
    allow(client).to receive(:create_webhook).with(url: webhook_url).and_return("id" => "WH-1")

    expect(service.process).to be(true)
    expect(provider.reload).to have_attributes(connected: true, enabled: true)
    expect(provider.webhook_id).to eq("WH-1")
    expect(provider.webhook_client_id).to eq("client-id")
    expect(provider.webhook_environment).to eq("sandbox")
    expect(provider.webhook_error).to be_nil
  end

  it "reuses an existing webhook when the URL is already registered" do
    allow(client).to receive(:access_token).and_return("token")
    allow(client).to receive(:create_webhook).and_raise(PaymentProviders::PaypalClient::Error.new("exists", issue: "WEBHOOK_URL_ALREADY_EXISTS"))
    allow(client).to receive(:list_webhooks).and_return([{ "id" => "WH-OLD", "url" => webhook_url }])

    expect(service.process).to be(true)
    expect(provider.webhook_id).to eq("WH-OLD")
  end

  it "skips webhook registration for non-https URLs and records why" do
    allow(client).to receive(:access_token).and_return("token")
    expect(client).not_to receive(:create_webhook)

    expect(described_class.new(provider:, webhook_url: "http://localhost:3000/webhooks/paypal/events").process).to be(true)
    expect(provider.webhook_id).to be_nil
    expect(provider.webhook_error).to eq("Webhook registration needs a public HTTPS URL")
    expect(provider.connected).to be(true)
  end

  it "keeps the connection but records a webhook failure" do
    allow(client).to receive(:access_token).and_return("token")
    allow(client).to receive(:create_webhook).and_raise(PaymentProviders::PaypalClient::Error.new("Webhook URL is invalid", issue: "WEBHOOK_URL_INVALID"))

    expect(service.process).to be(true)
    expect(provider.connected).to be(true)
    expect(provider.webhook_error).to eq("Webhook URL is invalid")
  end

  it "does not re-register when the webhook matches the current credentials" do
    provider.settings.merge!("webhook_id" => "WH-1", "webhook_client_id" => "client-id", "webhook_environment" => "sandbox")
    allow(client).to receive(:access_token).and_return("token")
    expect(client).not_to receive(:create_webhook)

    expect(service.process).to be(true)
  end

  it "saves a disconnected, disabled provider when credentials are rejected" do
    allow(client).to receive(:access_token).and_raise(PaymentProviders::PaypalClient::Error.new("Client Authentication failed"))

    expect(service.process).to be(false)
    expect(service.error).to eq("Client Authentication failed")
    expect(provider.reload).to have_attributes(connected: false, enabled: false)
  end

  it "saves without verification when credentials are absent" do
    provider.settings = { "environment" => "sandbox" }
    provider.enabled = false
    expect(client).not_to receive(:access_token)

    expect(service.process).to be(true)
    expect(provider.reload.connected).to be(false)
  end

  describe "#disconnect!" do
    it "deletes the webhook best-effort and destroys the provider" do
      provider.settings["webhook_id"] = "WH-1"
      provider.connected = true
      provider.save!
      allow(client).to receive(:delete_webhook).with("WH-1").and_raise(PaymentProviders::PaypalClient::Error.new("gone"))

      expect { service.disconnect! }.to change(PaymentsProvider, :count).by(-1)
    end
  end
end
```

- [ ] **Step 2: Run to verify failure**

Run: `rtk mise exec -- bundle exec rspec spec/services/payment_providers/paypal_connection_service_spec.rb`
Expected: NameError.

- [ ] **Step 3: Implement**

```ruby
# frozen_string_literal: true

module PaymentProviders
  class PaypalConnectionService
    NON_HTTPS_WEBHOOK_ERROR = "Webhook registration needs a public HTTPS URL"

    attr_reader :provider, :webhook_url, :error

    def initialize(provider:, webhook_url: nil)
      @provider = provider
      @webhook_url = webhook_url.to_s
    end

    def process
      unless provider.paypal_configured?
        provider.connected = false
        return save_provider
      end

      client.access_token
      provider.connected = true
      register_webhook if webhook_registration_needed?
      save_provider
    rescue PaypalClient::Error => exception
      @error = exception.message
      provider.connected = false
      provider.enabled = false
      provider.webhook_id = nil
      provider.save
      false
    end

    def disconnect!
      delete_webhook
      provider.destroy!
    end

    private

      def save_provider
        return true if provider.save

        @error = provider.errors.full_messages.to_sentence
        false
      end

      def webhook_registration_needed?
        provider.webhook_id.blank? ||
          provider.webhook_client_id != provider.client_id ||
          provider.webhook_environment != provider.paypal_environment
      end

      def register_webhook
        provider.webhook_id = nil
        unless webhook_url.start_with?("https://")
          provider.webhook_error = NON_HTTPS_WEBHOOK_ERROR
          return
        end

        webhook = client.create_webhook(url: webhook_url)
        remember_webhook(webhook["id"])
      rescue PaypalClient::Error => exception
        existing = existing_webhook_id if exception.issue == "WEBHOOK_URL_ALREADY_EXISTS"
        if existing.present?
          remember_webhook(existing)
        else
          provider.webhook_error = exception.message
        end
      end

      def existing_webhook_id
        client.list_webhooks.find { |webhook| webhook["url"] == webhook_url }&.dig("id")
      rescue PaypalClient::Error
        nil
      end

      def remember_webhook(webhook_id)
        provider.webhook_id = webhook_id
        provider.webhook_client_id = provider.client_id
        provider.webhook_environment = provider.paypal_environment
        provider.webhook_error = nil
      end

      def delete_webhook
        return if provider.webhook_id.blank? || !provider.paypal_configured?

        client.delete_webhook(provider.webhook_id)
      rescue PaypalClient::Error => exception
        Rails.logger.info("PayPal webhook delete skipped for provider #{provider.id}: #{exception.message}")
      end

      def client
        @_client ||= PaypalClient.new(provider:)
      end
  end
end
```

- [ ] **Step 4: Run specs**

Run: `rtk mise exec -- bundle exec rspec spec/services/payment_providers/paypal_connection_service_spec.rb`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add app/services/payment_providers/paypal_connection_service.rb spec/services/payment_providers/paypal_connection_service_spec.rb
git commit -m "feat(payments): verify PayPal credentials and register webhooks"
```

---

### Task 4: Order service and capture fulfillment

**Files:**
- Create: `app/services/payment_providers/paypal_order_service.rb`
- Create: `app/services/invoice_payment/paypal_capture_fulfillment.rb`
- Test: `spec/services/payment_providers/paypal_order_service_spec.rb`
- Test: `spec/services/invoice_payment/paypal_capture_fulfillment_spec.rb`

- [ ] **Step 1: Write failing specs**

`spec/services/payment_providers/paypal_order_service_spec.rb`:

```ruby
# frozen_string_literal: true

require "rails_helper"

RSpec.describe PaymentProviders::PaypalOrderService do
  let(:company) { create(:company, name: "Acme Studio") }
  let(:client_record) { create(:client, company:, currency: "USD") }
  let(:invoice) do
    create(:invoice, company:, client: client_record, currency: "USD", amount: 250, amount_due: 250, amount_paid: 0, status: "sent", invoice_number: "INV-42")
  end
  let(:provider) do
    create(
      :payments_provider,
      company:,
      name: PaymentsProvider::PAYPAL_PROVIDER,
      enabled: true,
      connected: true,
      settings: { client_id: "client-id", environment: "sandbox" }
    ).tap { |record| record.client_secret = "secret"; record.save! }
  end
  let(:client) { instance_double(PaymentProviders::PaypalClient) }
  let(:service) do
    described_class.new(
      invoice:,
      provider:,
      return_url: "https://app.miru.so/invoices/key/payments/paypal_return",
      cancel_url: "https://app.miru.so/invoices/key/payments/cancel"
    )
  end

  before do
    allow(PaymentProviders::PaypalClient).to receive(:new).with(provider:).and_return(client)
  end

  it "creates a capture order for the amount due and stores the order on the invoice" do
    expect(client).to receive(:create_order).with(
      hash_including(
        intent: "CAPTURE",
        purchase_units: [hash_including(
          reference_id: "miru-inv-#{invoice.id}",
          custom_id: invoice.id.to_s,
          description: "Invoice INV-42 from Acme Studio",
          amount: { currency_code: "USD", value: "250.00" }
        )],
        payment_source: { paypal: { experience_context: hash_including(
          brand_name: "Acme Studio",
          user_action: "PAY_NOW",
          shipping_preference: "NO_SHIPPING",
          payment_method_preference: "IMMEDIATE_PAYMENT_REQUIRED",
          return_url: "https://app.miru.so/invoices/key/payments/paypal_return",
          cancel_url: "https://app.miru.so/invoices/key/payments/cancel"
        ) } }
      ),
      request_id: kind_of(String)
    ).and_return(
      "id" => "ORDER-1",
      "status" => "PAYER_ACTION_REQUIRED",
      "links" => [{ "rel" => "self", "href" => "https://api.sandbox.paypal.com/v2/checkout/orders/ORDER-1" }, { "rel" => "payer-action", "href" => "https://www.sandbox.paypal.com/checkoutnow?token=ORDER-1" }]
    )

    expect(service.process).to eq("https://www.sandbox.paypal.com/checkoutnow?token=ORDER-1")
    expect(invoice.reload.paypal_order_id).to eq("ORDER-1")
    expect(invoice.paypal_order_status).to eq("PAYER_ACTION_REQUIRED")
  end

  it "accepts the legacy approve link" do
    allow(client).to receive(:create_order).and_return("id" => "ORDER-2", "status" => "CREATED", "links" => [{ "rel" => "approve", "href" => "https://www.sandbox.paypal.com/checkoutnow?token=ORDER-2" }])

    expect(service.process).to eq("https://www.sandbox.paypal.com/checkoutnow?token=ORDER-2")
  end

  it "raises when PayPal returns no approval link" do
    allow(client).to receive(:create_order).and_return("id" => "ORDER-3", "links" => [])

    expect { service.process }.to raise_error(PaymentProviders::PaypalClient::Error, "PayPal did not return an approval link")
  end
end
```

`spec/services/invoice_payment/paypal_capture_fulfillment_spec.rb`:

```ruby
# frozen_string_literal: true

require "rails_helper"

RSpec.describe InvoicePayment::PaypalCaptureFulfillment do
  let(:company) { create(:company) }
  let(:client_record) { create(:client, company:, currency: "USD", name: "Acme", email: "client@example.com") }
  let(:invoice) do
    create(:invoice, company:, client: client_record, currency: "USD", amount: 100, amount_due: 100, amount_paid: 0, status: "sent", payment_infos: { "paypal_order_id" => "ORDER-1" })
  end
  let!(:provider) do
    create(
      :payments_provider,
      company:,
      name: PaymentsProvider::PAYPAL_PROVIDER,
      enabled: true,
      connected: true,
      settings: { client_id: "client-id", environment: "sandbox" }
    ).tap { |record| record.client_secret = "secret"; record.save! }
  end
  let(:client) { instance_double(PaymentProviders::PaypalClient) }
  let(:completed_order) do
    {
      "id" => "ORDER-1",
      "status" => "COMPLETED",
      "payer" => { "name" => { "given_name" => "Jane", "surname" => "Buyer" }, "email_address" => "jane@example.com" },
      "purchase_units" => [{
        "custom_id" => invoice.id.to_s,
        "payments" => { "captures" => [{ "id" => "CAP-1", "status" => "COMPLETED", "amount" => { "currency_code" => "USD", "value" => "100.00" }, "create_time" => "2026-09-12T10:00:00Z" }] }
      }]
    }
  end
  let(:fulfillment) { described_class.new(invoice:, order_id: "ORDER-1") }

  before do
    allow(PaymentProviders::PaypalClient).to receive(:new).with(provider:).and_return(client)
  end

  it "captures the order and settles the invoice" do
    expect(client).to receive(:capture_order).with("ORDER-1", request_id: "capture-#{invoice.id}-ORDER-1").and_return(completed_order)

    expect { expect(fulfillment.process).to be(true) }.to change(Payment, :count).by(1)
    payment = Payment.last
    expect(payment).to have_attributes(transaction_type: "paypal", amount: 100, status: "paid", provider_event_id: "paypal:CAP-1", name: "Jane Buyer", transaction_date: Date.new(2026, 9, 12))
    expect(invoice.reload).to have_attributes(status: "paid", amount_due: 0)
    expect(invoice.paypal_capture_id).to eq("CAP-1")
    expect(invoice.paypal_order_status).to eq("COMPLETED")
  end

  it "sends payment emails on settlement" do
    allow(client).to receive(:capture_order).and_return(completed_order)

    expect { fulfillment.process }.to have_enqueued_job(ActionMailer::MailDeliveryJob).at_least(:once)
  end

  it "reads the order when PayPal reports it already captured" do
    allow(client).to receive(:capture_order).and_raise(PaymentProviders::PaypalClient::Error.new("captured", issue: "ORDER_ALREADY_CAPTURED"))
    expect(client).to receive(:show_order).with("ORDER-1").and_return(completed_order)

    expect(fulfillment.process).to be(true)
    expect(invoice.reload.status).to eq("paid")
  end

  it "does not settle twice for the same capture" do
    allow(client).to receive(:capture_order).and_return(completed_order)
    fulfillment.process
    invoice.update!(status: "sent", amount_due: 100, amount_paid: 0)

    expect { described_class.new(invoice:, order_id: "ORDER-1").process }.not_to change(Payment, :count)
  end

  it "returns true without calling PayPal when the invoice is already paid" do
    invoice.update!(status: "paid", amount_due: 0, amount_paid: 100)
    expect(client).not_to receive(:capture_order)

    expect(fulfillment.process).to be(true)
  end

  it "rejects captures for another invoice" do
    completed_order["purchase_units"][0]["custom_id"] = "999"
    allow(client).to receive(:capture_order).and_return(completed_order)

    expect(fulfillment.process).to be(false)
    expect(fulfillment.error).to eq("PayPal order does not belong to this invoice")
    expect(invoice.reload.status).to eq("sent")
  end

  it "rejects captures in a different currency" do
    completed_order["purchase_units"][0]["payments"]["captures"][0]["amount"]["currency_code"] = "EUR"
    allow(client).to receive(:capture_order).and_return(completed_order)

    expect(fulfillment.process).to be(false)
    expect(fulfillment.error).to eq("PayPal capture currency does not match the invoice")
  end

  it "fails when the capture is not completed" do
    completed_order["purchase_units"][0]["payments"]["captures"][0]["status"] = "PENDING"
    allow(client).to receive(:capture_order).and_return(completed_order)

    expect(fulfillment.process).to be(false)
    expect(fulfillment.error).to eq("PayPal payment is not completed")
  end

  it "fails with the PayPal message on API errors" do
    allow(client).to receive(:capture_order).and_raise(PaymentProviders::PaypalClient::Error.new("Instrument declined", issue: "INSTRUMENT_DECLINED"))

    expect(fulfillment.process).to be(false)
    expect(fulfillment.error).to eq("Instrument declined")
  end

  it "fails when the order id is blank" do
    expect(described_class.new(invoice:, order_id: "").process).to be(false)
  end

  it "fails when PayPal is not configured for the workspace" do
    provider.destroy!

    expect(fulfillment.process).to be(false)
    expect(fulfillment.error).to eq("PayPal is not configured for this workspace")
  end
end
```

- [ ] **Step 2: Run to verify failure**

Run: `rtk mise exec -- bundle exec rspec spec/services/payment_providers/paypal_order_service_spec.rb spec/services/invoice_payment/paypal_capture_fulfillment_spec.rb`
Expected: NameError.

- [ ] **Step 3: Implement the order service**

```ruby
# frozen_string_literal: true

module PaymentProviders
  class PaypalOrderService
    APPROVAL_LINK_RELS = ["payer-action", "approve"].freeze

    attr_reader :invoice, :provider, :return_url, :cancel_url

    def initialize(invoice:, provider:, return_url:, cancel_url:)
      @invoice = invoice
      @provider = provider
      @return_url = return_url
      @cancel_url = cancel_url
    end

    def process
      response = client.create_order(order_payload, request_id: SecureRandom.uuid)
      invoice.update!(
        paypal_order_id: response.fetch("id"),
        paypal_order_status: response["status"].presence || "CREATED"
      )
      approval_link(response) || raise(PaypalClient::Error, "PayPal did not return an approval link")
    end

    private

      def order_payload
        {
          intent: "CAPTURE",
          purchase_units: [{
            reference_id: "miru-inv-#{invoice.id}",
            custom_id: invoice.id.to_s,
            description: "Invoice #{invoice.invoice_number} from #{invoice.company.name}".truncate(127),
            amount: {
              currency_code: invoice.currency.to_s.upcase,
              value: PaypalAmount.format(invoice.amount_due, invoice.currency)
            }
          }],
          payment_source: {
            paypal: {
              experience_context: {
                brand_name: invoice.company.name.to_s.truncate(127),
                user_action: "PAY_NOW",
                shipping_preference: "NO_SHIPPING",
                landing_page: "NO_PREFERENCE",
                payment_method_preference: "IMMEDIATE_PAYMENT_REQUIRED",
                return_url:,
                cancel_url:
              }
            }
          }
        }
      end

      def approval_link(response)
        Array(response["links"]).find { |link| APPROVAL_LINK_RELS.include?(link["rel"]) }&.dig("href")
      end

      def client
        @_client ||= PaypalClient.new(provider:)
      end
  end
end
```

- [ ] **Step 4: Implement the capture fulfillment**

```ruby
# frozen_string_literal: true

class InvoicePayment::PaypalCaptureFulfillment
  attr_reader :invoice, :order_id, :error

  def initialize(invoice:, order_id:)
    @invoice = invoice
    @order_id = order_id.to_s
  end

  def process
    return fail_with("PayPal is not configured for this workspace") unless provider&.paypal_configured?
    return fail_with("PayPal order id is required") if order_id.blank?

    payment = settle_under_lock
    return false if error.present?

    send_payment_emails if payment.present? && invoice.paid?
    true
  rescue PaymentProviders::PaypalClient::Error => exception
    Rails.logger.warn("PayPal capture failed for invoice #{invoice.id} order #{order_id}: #{exception.message}")
    fail_with(exception.message)
  end

  private

    def settle_under_lock
      invoice.with_lock do
        return nil if invoice.paid?

        order = capture_or_fetch_order
        purchase_unit = Array(order["purchase_units"]).first || {}
        capture = completed_capture(purchase_unit)
        return fail_with("PayPal payment is not completed") && nil if capture.blank?
        return fail_with("PayPal order does not belong to this invoice") && nil unless purchase_unit["custom_id"] == invoice.id.to_s
        return fail_with("PayPal capture currency does not match the invoice") && nil unless capture.dig("amount", "currency_code").to_s.casecmp?(invoice.currency)

        provider_event_id = "paypal:#{capture['id']}"
        return nil if Payment.exists?(provider_event_id:)

        InvoicePayment::Settle.process(payment_params(order, capture, provider_event_id), invoice).tap do
          invoice.update!(
            paypal_order_id: order["id"],
            paypal_order_status: order["status"],
            paypal_capture_id: capture["id"]
          )
        end
      end
    end

    def capture_or_fetch_order
      client.capture_order(order_id, request_id: "capture-#{invoice.id}-#{order_id}")
    rescue PaymentProviders::PaypalClient::Error => exception
      raise unless exception.issue == "ORDER_ALREADY_CAPTURED"

      client.show_order(order_id)
    end

    def completed_capture(purchase_unit)
      Array(purchase_unit.dig("payments", "captures")).find { |capture| capture["status"] == "COMPLETED" }
    end

    def payment_params(order, capture, provider_event_id)
      {
        invoice_id: invoice.id,
        transaction_date: transaction_date(capture["create_time"]),
        transaction_type: "paypal",
        amount: PaymentProviders::PaypalAmount.parse(capture.dig("amount", "value")),
        payment_currency: invoice.currency,
        provider_event_id:,
        note: "PayPal_Payment_Success",
        name: payer_name(order)
      }
    end

    def transaction_date(create_time)
      Time.zone.parse(create_time.to_s)&.to_date || Date.current
    end

    def payer_name(order)
      name = order.dig("payer", "name") || {}
      [name["given_name"], name["surname"]].compact_blank.join(" ").presence
    end

    def send_payment_emails
      PaymentMailer.with(
        invoice_id: invoice.id,
        subject: "Payment details by #{invoice.client.name}"
      ).payment.deliver_later

      invoice.send_to_client_email(
        invoice_id: invoice.id,
        subject: "Payment Confirmation of Invoice #{invoice.invoice_number} by #{invoice.client.name}"
      )
    end

    def provider
      @_provider ||= invoice.company.payments_providers.find_by(name: PaymentsProvider::PAYPAL_PROVIDER)
    end

    def client
      @_client ||= PaymentProviders::PaypalClient.new(provider:)
    end

    def fail_with(message)
      @error = message
      false
    end
end
```

`return fail_with(...) && nil` inside `with_lock` is awkward; the engineer may restructure with a `validation_error(...)` helper that sets `@error` and returns `nil`, as long as the specs above pass unchanged. Keep `Rails.logger.warn` with the order id on failures.

- [ ] **Step 5: Run specs**

Run: `rtk mise exec -- bundle exec rspec spec/services/payment_providers/paypal_order_service_spec.rb spec/services/invoice_payment/paypal_capture_fulfillment_spec.rb`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add app/services/payment_providers/paypal_order_service.rb app/services/invoice_payment/paypal_capture_fulfillment.rb spec/services/payment_providers/paypal_order_service_spec.rb spec/services/invoice_payment/paypal_capture_fulfillment_spec.rb
git commit -m "feat(payments): create and capture PayPal orders for invoices"
```

---

### Task 5: Webhook fulfillment and controller

**Files:**
- Create: `app/services/invoice_payment/paypal_webhook_fulfillment.rb`
- Create: `app/controllers/webhooks/paypal_controller.rb`
- Modify: `config/routes.rb:78-82`
- Test: `spec/services/invoice_payment/paypal_webhook_fulfillment_spec.rb`
- Test: `spec/requests/webhooks/paypal_controller_spec.rb`

- [ ] **Step 1: Write failing specs**

`spec/services/invoice_payment/paypal_webhook_fulfillment_spec.rb`:

```ruby
# frozen_string_literal: true

require "rails_helper"

RSpec.describe InvoicePayment::PaypalWebhookFulfillment do
  let(:company) { create(:company) }
  let(:client_record) { create(:client, company:, currency: "USD") }
  let(:invoice) { create(:invoice, company:, client: client_record, currency: "USD", amount: 100, amount_due: 100, amount_paid: 0, status: "sent", payment_infos: { "paypal_order_id" => "ORDER-1" }) }
  let!(:provider) do
    create(
      :payments_provider,
      company:,
      name: PaymentsProvider::PAYPAL_PROVIDER,
      enabled: true,
      connected: true,
      settings: { client_id: "client-id", environment: "sandbox", webhook_id: "WH-1" }
    ).tap { |record| record.client_secret = "secret"; record.save! }
  end
  let(:headers) { { "PAYPAL-TRANSMISSION-ID" => "tid", "PAYPAL-TRANSMISSION-SIG" => "sig", "PAYPAL-TRANSMISSION-TIME" => "t", "PAYPAL-CERT-URL" => "https://api.sandbox.paypal.com/cert", "PAYPAL-AUTH-ALGO" => "SHA256withRSA" } }
  let(:client) { instance_double(PaymentProviders::PaypalClient) }
  let(:capture_fulfillment) { instance_double(InvoicePayment::PaypalCaptureFulfillment, process: true, error: nil) }

  before do
    allow(PaymentProviders::PaypalClient).to receive(:new).with(provider:).and_return(client)
    allow(InvoicePayment::PaypalCaptureFulfillment).to receive(:new).and_return(capture_fulfillment)
  end

  def payload_for(event_type, resource)
    { id: "WH-EVT-1", event_type:, resource: }.to_json
  end

  it "settles PAYMENT.CAPTURE.COMPLETED events after verifying the signature" do
    payload = payload_for("PAYMENT.CAPTURE.COMPLETED", { id: "CAP-1", status: "COMPLETED", custom_id: invoice.id.to_s, supplementary_data: { related_ids: { order_id: "ORDER-1" } } })
    expect(client).to receive(:verify_webhook_signature).with(headers:, body: payload, webhook_id: "WH-1").and_return(true)
    expect(InvoicePayment::PaypalCaptureFulfillment).to receive(:new).with(invoice:, order_id: "ORDER-1").and_return(capture_fulfillment)

    expect(described_class.new(payload:, headers:).process).to be(true)
  end

  it "captures CHECKOUT.ORDER.APPROVED events" do
    payload = payload_for("CHECKOUT.ORDER.APPROVED", { id: "ORDER-1", status: "APPROVED", purchase_units: [{ custom_id: invoice.id.to_s }] })
    allow(client).to receive(:verify_webhook_signature).and_return(true)
    expect(InvoicePayment::PaypalCaptureFulfillment).to receive(:new).with(invoice:, order_id: "ORDER-1").and_return(capture_fulfillment)

    expect(described_class.new(payload:, headers:).process).to be(true)
  end

  it "finds the invoice by order id when custom_id is missing" do
    payload = payload_for("PAYMENT.CAPTURE.COMPLETED", { id: "CAP-1", supplementary_data: { related_ids: { order_id: "ORDER-1" } } })
    allow(client).to receive(:verify_webhook_signature).and_return(true)
    invoice
    expect(InvoicePayment::PaypalCaptureFulfillment).to receive(:new).with(invoice:, order_id: "ORDER-1").and_return(capture_fulfillment)

    expect(described_class.new(payload:, headers:).process).to be(true)
  end

  it "ignores unsupported events" do
    fulfillment = described_class.new(payload: payload_for("PAYMENT.CAPTURE.REFUNDED", { id: "CAP-1" }), headers:)

    expect(fulfillment.process).to be(true)
  end

  it "rejects invalid signatures with an error code" do
    payload = payload_for("PAYMENT.CAPTURE.COMPLETED", { custom_id: invoice.id.to_s, supplementary_data: { related_ids: { order_id: "ORDER-1" } } })
    allow(client).to receive(:verify_webhook_signature).and_return(false)
    fulfillment = described_class.new(payload:, headers:)

    expect(fulfillment.process).to be(false)
    expect(fulfillment.error_code).to eq(:invalid_signature)
  end

  it "fails when the invoice cannot be found" do
    fulfillment = described_class.new(payload: payload_for("PAYMENT.CAPTURE.COMPLETED", { custom_id: "0", supplementary_data: { related_ids: { order_id: "NOPE" } } }), headers:)

    expect(fulfillment.process).to be(false)
    expect(fulfillment.error).to eq("Invoice not found")
  end

  it "fails when no webhook is registered for the workspace" do
    provider.update!(settings: provider.settings.except("webhook_id"))
    payload = payload_for("PAYMENT.CAPTURE.COMPLETED", { custom_id: invoice.id.to_s, supplementary_data: { related_ids: { order_id: "ORDER-1" } } })

    fulfillment = described_class.new(payload:, headers:)
    expect(fulfillment.process).to be(false)
    expect(fulfillment.error).to eq("PayPal webhook is not registered for this workspace")
  end

  it "surfaces capture errors" do
    payload = payload_for("CHECKOUT.ORDER.APPROVED", { id: "ORDER-1", purchase_units: [{ custom_id: invoice.id.to_s }] })
    allow(client).to receive(:verify_webhook_signature).and_return(true)
    allow(capture_fulfillment).to receive(:process).and_return(false)
    allow(capture_fulfillment).to receive(:error).and_return("Instrument declined")

    fulfillment = described_class.new(payload:, headers:)
    expect(fulfillment.process).to be(false)
    expect(fulfillment.error).to eq("Instrument declined")
  end

  it "fails on malformed JSON" do
    fulfillment = described_class.new(payload: "{", headers:)

    expect(fulfillment.process).to be(false)
    expect(fulfillment.error).to eq("Invalid PayPal webhook payload")
  end
end
```

`spec/requests/webhooks/paypal_controller_spec.rb`:

```ruby
# frozen_string_literal: true

require "rails_helper"

RSpec.describe "PayPal webhooks", type: :request do
  let(:headers) do
    {
      "CONTENT_TYPE" => "application/json",
      "PAYPAL-TRANSMISSION-ID" => "tid",
      "PAYPAL-TRANSMISSION-SIG" => "sig",
      "PAYPAL-TRANSMISSION-TIME" => "2026-09-12T10:00:00Z",
      "PAYPAL-CERT-URL" => "https://api.sandbox.paypal.com/cert",
      "PAYPAL-AUTH-ALGO" => "SHA256withRSA"
    }
  end
  let(:payload) { { id: "WH-EVT-1", event_type: "PAYMENT.CAPTURE.COMPLETED", resource: { custom_id: "1" } }.to_json }

  it "rejects oversized bodies" do
    post "/webhooks/paypal/events", params: "x" * (Webhooks::PaypalController::MAX_WEBHOOK_BODY_BYTES + 1), headers: { "CONTENT_TYPE" => "application/json" }

    expect(response).to have_http_status(:content_too_large)
  end

  it "passes the raw body and PayPal headers to the fulfillment service" do
    fulfillment = instance_double(InvoicePayment::PaypalWebhookFulfillment, process: true, error: nil, error_code: nil)
    expect(InvoicePayment::PaypalWebhookFulfillment).to receive(:new).with(
      payload:,
      headers: hash_including("PAYPAL-TRANSMISSION-ID" => "tid", "PAYPAL-TRANSMISSION-SIG" => "sig", "PAYPAL-AUTH-ALGO" => "SHA256withRSA")
    ).and_return(fulfillment)

    post "/webhooks/paypal/events", params: payload, headers:

    expect(response).to have_http_status(:ok)
    expect(JSON.parse(response.body)).to eq("status" => "ok")
  end

  it "answers 401 for invalid signatures" do
    fulfillment = instance_double(InvoicePayment::PaypalWebhookFulfillment, process: false, error: "Invalid PayPal webhook signature", error_code: :invalid_signature)
    allow(InvoicePayment::PaypalWebhookFulfillment).to receive(:new).and_return(fulfillment)

    post "/webhooks/paypal/events", params: payload, headers:

    expect(response).to have_http_status(:unauthorized)
  end

  it "answers 422 for other failures" do
    fulfillment = instance_double(InvoicePayment::PaypalWebhookFulfillment, process: false, error: "Invoice not found", error_code: nil)
    allow(InvoicePayment::PaypalWebhookFulfillment).to receive(:new).and_return(fulfillment)

    post "/webhooks/paypal/events", params: payload, headers:

    expect(response).to have_http_status(:unprocessable_content)
    expect(JSON.parse(response.body)["error"]).to eq("Invoice not found")
  end

  it "answers 500 and reports unexpected errors" do
    allow(InvoicePayment::PaypalWebhookFulfillment).to receive(:new).and_raise(StandardError, "boom")

    post "/webhooks/paypal/events", params: payload, headers:

    expect(response).to have_http_status(:internal_server_error)
  end
end
```

- [ ] **Step 2: Run to verify failure**

Run: `rtk mise exec -- bundle exec rspec spec/services/invoice_payment/paypal_webhook_fulfillment_spec.rb spec/requests/webhooks/paypal_controller_spec.rb`
Expected: NameError / routing error.

- [ ] **Step 3: Implement the fulfillment**

```ruby
# frozen_string_literal: true

class InvoicePayment::PaypalWebhookFulfillment
  CAPTURE_COMPLETED_EVENT = "PAYMENT.CAPTURE.COMPLETED"
  ORDER_APPROVED_EVENT = "CHECKOUT.ORDER.APPROVED"
  SUPPORTED_EVENTS = [CAPTURE_COMPLETED_EVENT, ORDER_APPROVED_EVENT].freeze

  attr_reader :payload, :headers, :error, :error_code

  def initialize(payload:, headers:)
    @payload = payload.to_s
    @headers = headers || {}
  end

  def process
    return true unless SUPPORTED_EVENTS.include?(event_type)
    return fail_with("Invoice not found") if invoice.blank?
    return fail_with("PayPal is not configured for this workspace") unless provider&.paypal_configured?
    return fail_with("PayPal webhook is not registered for this workspace") if provider.webhook_id.blank?
    return fail_with("Invalid PayPal webhook signature", :invalid_signature) unless valid_signature?
    return fail_with("PayPal order id is missing") if order_id.blank?

    fulfillment = InvoicePayment::PaypalCaptureFulfillment.new(invoice:, order_id:)
    return true if fulfillment.process

    fail_with(fulfillment.error || "Unable to settle PayPal payment")
  rescue JSON::ParserError
    fail_with("Invalid PayPal webhook payload")
  end

  private

    def parsed_payload
      @_parsed_payload ||= JSON.parse(payload)
    end

    def event_type
      parsed_payload["event_type"].to_s
    end

    def resource
      parsed_payload["resource"].is_a?(Hash) ? parsed_payload["resource"] : {}
    end

    def order_id
      if event_type == ORDER_APPROVED_EVENT
        resource["id"].to_s
      else
        resource.dig("supplementary_data", "related_ids", "order_id").to_s
      end
    end

    def custom_id
      if event_type == ORDER_APPROVED_EVENT
        Array(resource["purchase_units"]).first&.dig("custom_id").to_s
      else
        resource["custom_id"].to_s
      end
    end

    def invoice
      @_invoice ||= begin
        record = Invoice.kept.find_by(id: custom_id) if custom_id.match?(/\A\d+\z/)
        record || invoice_from_order_id
      end
    end

    def invoice_from_order_id
      return if order_id.blank?

      Invoice.kept.find_by("payment_infos ->> 'paypal_order_id' = ?", order_id)
    end

    def provider
      @_provider ||= invoice&.company&.payments_providers&.find_by(name: PaymentsProvider::PAYPAL_PROVIDER)
    end

    def valid_signature?
      PaymentProviders::PaypalClient.new(provider:).verify_webhook_signature(headers:, body: payload, webhook_id: provider.webhook_id)
    rescue PaymentProviders::PaypalClient::Error
      false
    end

    def fail_with(message, code = nil)
      @error = message
      @error_code = code
      false
    end
end
```

Note: `JSON::ParserError` must be raised before the first `return true unless SUPPORTED_EVENTS...` line resolves; `event_type` calls `parsed_payload`, so the rescue catches it.

- [ ] **Step 4: Implement the controller and route**

`app/controllers/webhooks/paypal_controller.rb`:

```ruby
# frozen_string_literal: true

class Webhooks::PaypalController < ApplicationController
  MAX_WEBHOOK_BODY_BYTES = 1.megabyte

  skip_around_action :switch_locale
  skip_before_action :authenticate_user!
  skip_before_action :verify_authenticity_token
  skip_after_action :verify_authorized

  def events
    payload = bounded_payload
    return if performed?

    fulfillment = InvoicePayment::PaypalWebhookFulfillment.new(payload:, headers: paypal_headers)

    if fulfillment.process
      render json: { status: "ok" }, status: 200
    else
      render json: { error: fulfillment.error || "Unable to process PayPal webhook" }, status: failure_status(fulfillment)
    end
  rescue StandardError => exception
    log_processing_error(exception)
    render json: { error: "Unable to process PayPal webhook" }, status: 500
  end

  private

    def bounded_payload
      payload = request.body.read(MAX_WEBHOOK_BODY_BYTES + 1).to_s
      return payload if payload.bytesize <= MAX_WEBHOOK_BODY_BYTES

      render json: { error: "PayPal webhook payload is too large" }, status: 413
      nil
    end

    def paypal_headers
      PaymentProviders::PaypalClient::SIGNATURE_HEADERS.values.index_with { |name| request.headers[name].to_s }
    end

    def failure_status(fulfillment)
      fulfillment.error_code == :invalid_signature ? 401 : 422
    end

    def log_processing_error(exception)
      Sentry.capture_exception(exception, extra: { request_id: request.request_id, webhook: "paypal_events" }) if defined?(Sentry)
      Rails.logger.error(
        "[PayPal webhook] failed request_id=#{request.request_id} error_class=#{exception.class.name} error_message=#{exception.message}"
      )
    end
end
```

In `config/routes.rb` inside `namespace :webhooks do`:

```ruby
    post "paypal/events", to: "paypal#events"
```

- [ ] **Step 5: Run specs**

Run: `rtk mise exec -- bundle exec rspec spec/services/invoice_payment/paypal_webhook_fulfillment_spec.rb spec/requests/webhooks/paypal_controller_spec.rb spec/requests/webhooks/razorpay_controller_spec.rb`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add app/services/invoice_payment/paypal_webhook_fulfillment.rb app/controllers/webhooks/paypal_controller.rb config/routes.rb spec/services/invoice_payment/paypal_webhook_fulfillment_spec.rb spec/requests/webhooks/paypal_controller_spec.rb
git commit -m "feat(payments): reconcile PayPal captures through webhooks"
```

---

### Task 6: Public payment flow (new + paypal_return) and invoice view payload

**Files:**
- Modify: `app/controllers/invoices/payments_controller.rb`
- Modify: `config/routes.rb:60-66`
- Modify: `app/views/api/v1/invoices/view/show.json.jbuilder`
- Test: `spec/requests/invoices/payments_controller_spec.rb`
- Test: `spec/requests/api/v1/invoices/view_spec.rb`

- [ ] **Step 1: Write failing specs**

Add to `spec/requests/invoices/payments_controller_spec.rb` inside `describe "GET new"`:

```ruby
    context "when PayPal is requested and enabled", vcr: false do
      let!(:paypal_provider) do
        create(
          :payments_provider,
          company:,
          name: PaymentsProvider::PAYPAL_PROVIDER,
          enabled: true,
          connected: true,
          settings: { client_id: "client-id", environment: "sandbox", enabled_on_invoices: true }
        ).tap { |record| record.client_secret = "secret"; record.save! }
      end

      before do
        invoice.update!(currency: "USD")
        allow_any_instance_of(PaymentProviders::PaypalOrderService).to receive(:process).and_return("https://www.sandbox.paypal.com/checkoutnow?token=ORDER-1")
      end

      it "redirects to the PayPal approval URL" do
        send_request :get, new_invoice_payment_path(params.merge(provider: "paypal"))

        expect(response).to redirect_to("https://www.sandbox.paypal.com/checkoutnow?token=ORDER-1")
      end

      it "falls back to PayPal when Stripe is not connected" do
        stripe_connected_account.destroy!

        send_request :get, new_invoice_payment_path(params)

        expect(response).to redirect_to("https://www.sandbox.paypal.com/checkoutnow?token=ORDER-1")
      end

      it "keeps Stripe as the default when both are available" do
        send_request :get, new_invoice_payment_path(params)

        expect(response).to redirect_to(success_path)
      end

      it "redirects to the cancel page when PayPal order creation fails" do
        allow_any_instance_of(PaymentProviders::PaypalOrderService).to receive(:process).and_raise(PaymentProviders::PaypalClient::Error.new("Currency not supported"))

        send_request :get, new_invoice_payment_path(params.merge(provider: "paypal"))

        expect(response).to redirect_to(cancel_invoice_payments_url(invoice.external_view_key))
      end

      it "ignores the PayPal parameter for unsupported currencies" do
        invoice.update!(currency: "INR")

        send_request :get, new_invoice_payment_path(params.merge(provider: "paypal"))

        expect(response).to redirect_to(success_path)
      end
    end
```

Add a new describe block:

```ruby
  describe "GET paypal_return", vcr: false do
    it "captures the order and redirects to the success page" do
      fulfillment = instance_double(InvoicePayment::PaypalCaptureFulfillment, process: true, error: nil)
      expect(InvoicePayment::PaypalCaptureFulfillment).to receive(:new).with(invoice:, order_id: "ORDER-1").and_return(fulfillment)

      send_request :get, paypal_return_invoice_payments_path(params.merge(token: "ORDER-1", PayerID: "PAYER"))

      expect(response).to redirect_to("http://www.example.com/invoices/#{invoice.external_view_key}/payments/success?provider=paypal")
    end

    it "redirects to the cancel page when capture fails" do
      fulfillment = instance_double(InvoicePayment::PaypalCaptureFulfillment, process: false, error: "Instrument declined")
      allow(InvoicePayment::PaypalCaptureFulfillment).to receive(:new).and_return(fulfillment)

      send_request :get, paypal_return_invoice_payments_path(params.merge(token: "ORDER-1"))

      expect(response).to redirect_to(cancel_invoice_payments_url(invoice.external_view_key))
      expect(flash[:alert]).to eq("Unable to verify PayPal payment")
    end
  end
```

Check the host used by `redirect_to` in the existing Razorpay spec for `razorpay_success` and match it (the existing spec uses `request.base_url`; assert with `response.location` ending in `/payments/success?provider=paypal` if the host differs).

Add to `spec/requests/api/v1/invoices/view_spec.rb`:

```ruby
      it "exposes PayPal as a payment option when enabled for a supported currency" do
        create(
          :payments_provider,
          company:,
          name: PaymentsProvider::PAYPAL_PROVIDER,
          enabled: true,
          connected: true,
          settings: { client_id: "client-id", environment: "sandbox", enabled_on_invoices: true }
        ).tap { |record| record.client_secret = "secret"; record.save! }
        invoice.update!(currency: "USD")

        send_request :get, api_v1_invoices_view_path(invoice.external_view_key)

        expect(json_response.dig("paypal_payment", "enabled")).to be(true)
        expect(json_response.dig("paypal_payment", "url")).to end_with("/invoices/#{invoice.external_view_key}/payments/new?provider=paypal")
        expect(json_response.to_json).not_to include("client-id")
      end

      it "hides PayPal for unsupported currencies" do
        create(
          :payments_provider,
          company:,
          name: PaymentsProvider::PAYPAL_PROVIDER,
          enabled: true,
          connected: true,
          settings: { client_id: "client-id", environment: "sandbox", enabled_on_invoices: true }
        ).tap { |record| record.client_secret = "secret"; record.save! }
        invoice.update!(currency: "INR")

        send_request :get, api_v1_invoices_view_path(invoice.external_view_key)

        expect(json_response.dig("paypal_payment", "enabled")).to be(false)
      end
```

- [ ] **Step 2: Run to verify failure**

Run: `rtk mise exec -- bundle exec rspec spec/requests/invoices/payments_controller_spec.rb spec/requests/api/v1/invoices/view_spec.rb`
Expected: failures for the PayPal examples.

- [ ] **Step 3: Implement the controller**

Rewrite `app/controllers/invoices/payments_controller.rb` `new`, add `paypal_return`, keep `cancel` and `razorpay_success` unchanged:

```ruby
  def new
    redirect_to payment_url, allow_other_host: true
  rescue PaymentProviders::RazorpayClient::Error, PaymentProviders::PaypalClient::Error => error
    Rails.logger.warn("Payment link failed for invoice #{@invoice.id}: #{error.class} #{error.message}")
    redirect_to cancel_invoice_payments_url(@invoice.external_view_key), alert: "Unable to start the payment"
  end

  def paypal_return
    fulfillment = InvoicePayment::PaypalCaptureFulfillment.new(invoice: @invoice, order_id: params[:token].to_s)

    if fulfillment.process
      redirect_to request.base_url + "/invoices/#{@invoice.external_view_key}/payments/success?provider=paypal", allow_other_host: false
    else
      Rails.logger.warn("PayPal capture failed for invoice #{@invoice.id}: #{fulfillment.error}")
      redirect_to cancel_invoice_payments_url(@invoice.external_view_key), alert: "Unable to verify PayPal payment"
    end
  end
```

Private helpers:

```ruby
    def payment_url
      return paypal_payment_url if paypal_requested? && paypal_provider.present?
      return razorpay_payment_url if razorpay_provider.present?
      return stripe_payment_url if @invoice.company.stripe_connected_account.present?
      return paypal_payment_url if paypal_provider.present?

      stripe_payment_url
    end

    def paypal_requested?
      params[:provider].to_s == PaymentsProvider::PAYPAL_PROVIDER
    end

    def paypal_payment_url
      PaymentProviders::PaypalOrderService.new(
        invoice: @invoice,
        provider: paypal_provider,
        return_url: paypal_return_invoice_payments_url(@invoice.external_view_key),
        cancel_url: cancel_invoice_payments_url(@invoice.external_view_key)
      ).process
    end

    def razorpay_payment_url
      PaymentProviders::RazorpayPaymentLinkService.new(
        invoice: @invoice,
        provider: razorpay_provider,
        callback_url: razorpay_success_invoice_payments_url(@invoice.external_view_key)
      ).process
    end

    def stripe_payment_url
      @invoice.create_checkout_session!(
        success_url: request.base_url + "/invoices/#{@invoice.external_view_key}/payments/success",
        cancel_url: cancel_invoice_payments_url(@invoice.external_view_key)
      ).url
    end

    def paypal_provider
      return @_paypal_provider if instance_variable_defined?(:@_paypal_provider)

      provider = @invoice.company.payments_providers.find_by(name: PaymentsProvider::PAYPAL_PROVIDER, enabled: true)
      @_paypal_provider =
        if provider&.enabled_on_invoices? && provider.paypal_configured? && provider.connected? && PaymentsProvider.paypal_currency_supported?(@invoice.currency)
          provider
        end
    end
```

Keep the existing Razorpay warning message text in the rescue if the existing spec asserts it (check `spec/requests/invoices/payments_controller_spec.rb`; the alert text is not asserted today).

`ensure_invoice_unpaid` stays `only: [:new]`.

Route in `config/routes.rb`:

```ruby
  resources :invoices, only: [], module: :invoices do
    resources :payments, only: [:new] do
      collection do
        get :cancel
        get :razorpay_success
        get :paypal_return
      end
    end
  end
```

- [ ] **Step 4: Implement the view payload**

In `app/views/api/v1/invoices/view/show.json.jbuilder`, after the `razorpay_provider` lookup:

```ruby
paypal_provider = invoice.company.payments_providers.find_by(name: PaymentsProvider::PAYPAL_PROVIDER, enabled: true)
```

and after the `razorpay_payment` block:

```ruby
json.paypal_payment do
  json.enabled !!(
    paypal_provider&.enabled_on_invoices? &&
    paypal_provider&.paypal_configured? &&
    paypal_provider&.connected? &&
    PaymentsProvider.paypal_currency_supported?(invoice.currency)
  )
  json.url "#{new_invoice_payment_url(invoice.external_view_key)}?provider=paypal"
end
```

- [ ] **Step 5: Run specs**

Run: `rtk mise exec -- bundle exec rspec spec/requests/invoices/payments_controller_spec.rb spec/requests/api/v1/invoices/view_spec.rb`
Expected: PASS, including the pre-existing Stripe and Razorpay examples.

- [ ] **Step 6: Commit**

```bash
git add app/controllers/invoices/payments_controller.rb config/routes.rb app/views/api/v1/invoices/view/show.json.jbuilder spec/requests/invoices/payments_controller_spec.rb spec/requests/api/v1/invoices/view_spec.rb
git commit -m "feat(payments): offer PayPal on public invoices"
```

---

### Task 7: Payment settings API (update, disconnect, payload)

**Files:**
- Modify: `app/controllers/api/v1/payment_settings_controller.rb`
- Modify: `app/policies/payment_settings_policy.rb`
- Modify: `app/views/api/v1/payment_settings/index.json.jbuilder`
- Modify: `config/routes/api.rb:209-210`
- Test: `spec/requests/api/v1/payment_settings_controller_spec.rb`

- [ ] **Step 1: Write failing specs**

Append inside the top-level describe of `spec/requests/api/v1/payment_settings_controller_spec.rb`:

```ruby
  describe "PATCH #update_paypal" do
    let(:connection_service) { instance_double(PaymentProviders::PaypalConnectionService, process: true, error: nil) }

    before do
      allow(PaymentProviders::PaypalConnectionService).to receive(:new).and_return(connection_service)
    end

    it "saves credentials through the connection service and returns the settings payload" do
      expect(PaymentProviders::PaypalConnectionService).to receive(:new) do |provider:, webhook_url:|
        expect(provider.client_id).to eq("client-id")
        expect(provider.client_secret).to eq("secret")
        expect(provider.paypal_environment).to eq("sandbox")
        expect(provider.enabled).to be(true)
        expect(provider.enabled_on_invoices?).to be(true)
        expect(provider.accepted_payment_methods).to eq(["paypal"])
        expect(webhook_url).to eq("http://www.example.com/webhooks/paypal/events")
        provider.connected = true
        provider.settings["webhook_id"] = "WH-1"
        provider.save!
        connection_service
      end

      patch api_v1_payments_settings_paypal_path, params: {
        provider: { enabled: true, enabled_on_invoices: true, client_id: "client-id", client_secret: "secret", environment: "sandbox" }
      }

      expect(response).to have_http_status(:success)
      paypal = JSON.parse(response.body)["providers"]["paypal"]
      expect(paypal).to include("connected" => true, "enabled" => true, "enabledOnInvoices" => true, "clientId" => "client-id", "clientSecretConfigured" => true, "environment" => "sandbox", "webhookId" => "WH-1")
      expect(paypal["webhookUrl"]).to eq("http://www.example.com/webhooks/paypal/events")
      expect(paypal).not_to have_key("clientSecret")
    end

    it "keeps the stored secret when a blank secret is sent" do
      provider = company.payments_providers.create!(name: PaymentsProvider::PAYPAL_PROVIDER, settings: { client_id: "client-id" })
      provider.client_secret = "old-secret"
      provider.save!

      patch api_v1_payments_settings_paypal_path, params: { provider: { client_id: "client-id", client_secret: "", environment: "live" } }

      expect(response).to have_http_status(:success)
      expect(provider.reload.client_secret).to eq("old-secret")
    end

    it "returns 422 with the PayPal error when the connection fails" do
      allow(connection_service).to receive_messages(process: false, error: "Client Authentication failed")

      patch api_v1_payments_settings_paypal_path, params: { provider: { client_id: "client-id", client_secret: "bad", environment: "sandbox", enabled: true } }

      expect(response).to have_http_status(:unprocessable_content)
      expect(JSON.parse(response.body)["errors"]).to eq("Client Authentication failed")
    end

    it "is forbidden for employees" do
      user.remove_role :admin, company
      user.add_role :employee, company

      patch api_v1_payments_settings_paypal_path, params: { provider: { client_id: "x" } }

      expect(response).to have_http_status(:forbidden)
    end
  end

  describe "DELETE #disconnect_paypal" do
    it "disconnects through the connection service" do
      company.payments_providers.create!(name: PaymentsProvider::PAYPAL_PROVIDER, settings: { client_id: "client-id" })
      service = instance_double(PaymentProviders::PaypalConnectionService)
      allow(PaymentProviders::PaypalConnectionService).to receive(:new).and_return(service)
      expect(service).to receive(:disconnect!) { company.payments_providers.find_by(name: "paypal").destroy! }

      delete api_v1_payments_settings_paypal_path

      expect(response).to have_http_status(:success)
      expect(JSON.parse(response.body)["providers"]["paypal"]["connected"]).to be(false)
    end

    it "returns 404 when PayPal was never configured" do
      delete api_v1_payments_settings_paypal_path

      expect(response).to have_http_status(:not_found)
    end
  end
```

Also extend the `GET #index` example to assert `json_response["providers"]["paypal"]["connected"]` is `false`.

- [ ] **Step 2: Run to verify failure**

Run: `rtk mise exec -- bundle exec rspec spec/requests/api/v1/payment_settings_controller_spec.rb`
Expected: routing errors for the new paths.

- [ ] **Step 3: Implement routes, policy, controller, jbuilder**

`config/routes/api.rb` after the razorpay line:

```ruby
    patch "payments/settings/paypal", to: "payment_settings#update_paypal", as: :payments_settings_paypal
    delete "payments/settings/paypal", to: "payment_settings#disconnect_paypal"
```

`app/policies/payment_settings_policy.rb`:

```ruby
  def update_paypal?
    update_upi?
  end

  def disconnect_paypal?
    update_upi?
  end
```

Controller additions:

```ruby
  def update_paypal
    authorize :update_paypal, policy_class: PaymentSettingsPolicy

    paypal_provider.assign_attributes(paypal_provider_attributes)
    paypal_provider.client_secret = paypal_params[:client_secret].to_s.strip

    service = PaymentProviders::PaypalConnectionService.new(provider: paypal_provider, webhook_url: paypal_webhook_url)
    if service.process
      render :index, locals: payment_settings_locals
    else
      render json: { errors: service.error }, status: 422
    end
  end

  def disconnect_paypal
    authorize :disconnect_paypal, policy_class: PaymentSettingsPolicy

    provider = current_company.payments_providers.find_by(name: PaymentsProvider::PAYPAL_PROVIDER)
    return render json: { errors: "PayPal is not connected" }, status: 404 if provider.blank?

    PaymentProviders::PaypalConnectionService.new(provider:).disconnect!
    @_paypal_provider = nil
    render :index, locals: payment_settings_locals
  end
```

Private:

```ruby
    def paypal_provider
      @_paypal_provider ||= current_company.payments_providers.find_or_initialize_by(name: PaymentsProvider::PAYPAL_PROVIDER)
    end

    def paypal_webhook_url
      "#{request.base_url}/webhooks/paypal/events"
    end

    def paypal_params
      params.require(:provider).permit(:enabled, :enabled_on_invoices, :client_id, :client_secret, :environment)
    end

    def paypal_provider_attributes
      {
        enabled: boolean_type.cast(paypal_params[:enabled]),
        accepted_payment_methods: ["paypal"],
        enabled_on_invoices: paypal_params.key?(:enabled_on_invoices) ? boolean_type.cast(paypal_params[:enabled_on_invoices]) : paypal_provider.enabled_on_invoices?,
        client_id: paypal_params[:client_id].to_s.strip,
        environment: paypal_params[:environment].presence || paypal_provider.paypal_environment
      }
    end
```

Add `paypal_provider:` to `payment_settings_locals`.

Jbuilder block after `razorpay`:

```ruby
  json.paypal do
    json.connected paypal_provider&.connected? || false
    json.enabled paypal_provider&.enabled? || false
    json.enabled_on_invoices paypal_provider&.enabled_on_invoices? || false
    json.client_id paypal_provider&.client_id
    json.client_secret_configured paypal_provider&.client_secret.present? || false
    json.environment paypal_provider&.paypal_environment || "live"
    json.webhook_id paypal_provider&.webhook_id
    json.webhook_error paypal_provider&.webhook_error
    json.webhook_url "#{request.base_url}/webhooks/paypal/events"
    json.supported_currencies PaymentsProvider::PAYPAL_CURRENCIES
  end
```

The `update_upi`/`update_razorpay` actions render `:index` with `payment_settings_locals`, so they pick up the new local automatically.

- [ ] **Step 4: Run specs**

Run: `rtk mise exec -- bundle exec rspec spec/requests/api/v1/payment_settings_controller_spec.rb spec/requests/api/v1/payments`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add app/controllers/api/v1/payment_settings_controller.rb app/policies/payment_settings_policy.rb app/views/api/v1/payment_settings/index.json.jbuilder config/routes/api.rb spec/requests/api/v1/payment_settings_controller_spec.rb
git commit -m "feat(payments): PayPal settings API"
```

---

### Task 8: Frontend — settings card

**Files:**
- Modify: `app/javascript/src/apis/api.ts:417-426`
- Modify: `app/javascript/src/components/Profile/Organization/Payment/Page.tsx`
- Modify: `app/javascript/src/i18n/locales/en.ts` (`paymentSettingsPage` block)

- [ ] **Step 1: API client**

```ts
export const paymentSettingsApi = {
  get: () => http.get(`/payments/settings`),
  updateUpi: (provider: any) => http.patch(`/payments/settings/upi`, { provider }),
  updateRazorpay: (provider: any) =>
    http.patch(`/payments/settings/razorpay`, { provider }),
  updatePaypal: (provider: any) =>
    http.patch(`/payments/settings/paypal`, { provider }, { skipErrorToast: true }),
  disconnectPaypal: () => http.delete(`/payments/settings/paypal`),
  connectStripe: () => http.post(`/payments/settings/stripe/connect`),
  disconnectStripe: () => http.delete(`/payments/settings/stripe/disconnect`),
};
```

(`skipErrorToast` exists on the http wrapper; see `quickBooksApi.sync`. The page shows the PayPal error message itself.)

- [ ] **Step 2: i18n keys** (add inside `paymentSettingsPage`):

```ts
    paypalTitle: "PayPal",
    paypalBadge: "Global payments",
    paypalDescription:
      "Let clients pay invoices with their PayPal balance, bank, or card. Paste the Client ID and Secret from a REST app in your PayPal Developer Dashboard.",
    openPaypalDeveloper: "Open PayPal Developer",
    paypalClientId: "Client ID",
    paypalClientSecret: "Client secret",
    enterClientSecret: "Enter client secret",
    paypalSandbox: "Sandbox mode",
    paypalSandboxHint: "Use sandbox credentials for testing. Turn off for live payments.",
    showPaypalOnInvoices: "Show PayPal on invoices",
    paypalEnabled: "Enabled",
    savePaypal: "Save PayPal",
    savingPaypal: "Saving...",
    paypalSaved: "PayPal settings saved.",
    paypalSaveFailed: "Failed to save PayPal settings.",
    paypalClientIdRequired: "Add a PayPal client ID before saving.",
    paypalClientSecretRequired: "Add a PayPal client secret before saving.",
    paypalDisconnect: "Disconnect",
    paypalDisconnecting: "Disconnecting...",
    paypalDisconnected: "PayPal disconnected.",
    paypalDisconnectFailed: "Failed to disconnect PayPal.",
    paypalDisconnectDialogTitle: "Disconnect PayPal",
    paypalDisconnectDialogDescription:
      "Clients will no longer see PayPal on invoices. Miru removes its webhook from your PayPal app and forgets the credentials.",
    paypalWebhookRegistered: "Webhook registered",
    paypalWebhookMissing: "Webhook not registered",
    paypalWebhookUrl: "Webhook URL",
    paypalSupportedCurrencies: "Shown on invoices in PayPal-supported currencies (USD, EUR, GBP, AUD, CAD, and more). Not available for INR.",
    paypalEnvironmentSandbox: "Sandbox",
    paypalEnvironmentLive: "Live",
```

- [ ] **Step 3: Page state, fetch mapping, handlers**

State (next to `razorpaySettings`):

```tsx
  const paypalProviderRef = useRef<HTMLDivElement | null>(null);
  const [isSavingPaypal, setIsSavingPaypal] = useState<boolean>(false);
  const [isDisconnectingPaypal, setIsDisconnectingPaypal] = useState<boolean>(false);
  const [showPaypalDisconnectDialog, setShowPaypalDisconnectDialog] = useState<boolean>(false);
  const [paypalSettings, setPaypalSettings] = useState({
    connected: false,
    enabled: false,
    enabledOnInvoices: true,
    clientId: "",
    clientSecret: "",
    clientSecretConfigured: false,
    environment: "live",
    webhookId: "",
    webhookError: "",
    webhookUrl: "",
  });

  const applyPaypalSettings = (paypal: any = {}) => {
    setPaypalSettings(settings => ({
      ...settings,
      connected: !!paypal.connected,
      enabled: !!paypal.enabled,
      enabledOnInvoices: paypal.enabledOnInvoices ?? true,
      clientId: paypal.clientId || "",
      clientSecret: "",
      clientSecretConfigured: !!paypal.clientSecretConfigured,
      environment: paypal.environment || "live",
      webhookId: paypal.webhookId || "",
      webhookError: paypal.webhookError || "",
      webhookUrl: paypal.webhookUrl || "",
    }));
  };

  const updatePaypalSetting = (key: string, value: string | boolean) => {
    setPaypalSettings(settings => ({ ...settings, [key]: value }));
  };
```

In `fetchPaymentSettings`, after the Razorpay block: `applyPaypalSettings(res.data.providers.paypal);`

Handlers:

```tsx
  const savePaypalSettings = async () => {
    if (paypalSettings.clientId.trim().length === 0) {
      toast.error(i18n.t("paymentSettingsPage.paypalClientIdRequired"));

      return;
    }

    if (
      !paypalSettings.clientSecretConfigured &&
      paypalSettings.clientSecret.trim().length === 0
    ) {
      toast.error(i18n.t("paymentSettingsPage.paypalClientSecretRequired"));

      return;
    }

    try {
      setIsSavingPaypal(true);
      const res = await paymentSettings.updatePaypal({
        enabled: paypalSettings.enabled,
        enabled_on_invoices: paypalSettings.enabledOnInvoices,
        client_id: paypalSettings.clientId,
        client_secret: paypalSettings.clientSecret,
        environment: paypalSettings.environment,
      });
      applyPaypalSettings(res.data.providers.paypal);
      toast.success(i18n.t("paymentSettingsPage.paypalSaved"));
    } catch (error) {
      const message =
        error?.response?.data?.errors ||
        i18n.t("paymentSettingsPage.paypalSaveFailed");
      toast.error(message);
    } finally {
      setIsSavingPaypal(false);
    }
  };

  const disconnectPaypal = async () => {
    try {
      setIsDisconnectingPaypal(true);
      const res = await paymentSettings.disconnectPaypal();
      applyPaypalSettings(res.data.providers.paypal);
      setShowPaypalDisconnectDialog(false);
      toast.success(i18n.t("paymentSettingsPage.paypalDisconnected"));
    } catch (error) {
      toast.error(i18n.t("paymentSettingsPage.paypalDisconnectFailed"));
    } finally {
      setIsDisconnectingPaypal(false);
    }
  };
```

Extend the existing `?provider=razorpay` scroll effect (around line 540-555) so `provider=paypal` scrolls `paypalProviderRef` the same way.

- [ ] **Step 4: Card JSX**

Insert a `{/* PayPal Provider */}` block between the Stripe card and the `{/* UPI Provider */}` card. Follow the Razorpay card's structure (same outer `div.rounded-lg.border`, icon box, title + badge, description). Use the `CreditCard` icon or an inline PayPal "P" SVG with `fill="#003087"`. Contents, top to bottom:

1. Header row: title `paypalTitle`, badge `paypalBadge`; on the right, when `paypalSettings.connected`: `Badge` "Connected" + `Badge` with environment label (`paypalEnvironmentSandbox`/`paypalEnvironmentLive`) + outline destructive `Button` "Disconnect" opening `showPaypalDisconnectDialog`.
2. Description paragraph + `Button asChild variant="outline"` linking to `https://developer.paypal.com/dashboard/applications/live` (`target="_blank" rel="noreferrer"`) with `openPaypalDeveloper`.
3. Inputs grid (`grid-cols-1 md:grid-cols-2`): `Input#paypal_client_id` (value `clientId`), `Input#paypal_client_secret` type password with the same "Secret already saved" placeholder pattern as Razorpay.
4. Switch row: `Switch#paypal_sandbox` (checked when `environment === "sandbox"`, toggles between `"sandbox"`/`"live"`) with `paypalSandboxHint`; `Switch#paypal_on_invoices` (`enabledOnInvoices`); `Switch#paypal_enabled` (`enabled`, disabled unless `paypalSettings.connected || paypalSettings.clientSecretConfigured || paypalSettings.clientSecret.length > 0`).
5. Webhook status line: when `webhookId` present show `CheckCircle2` + `paypalWebhookRegistered`; else `AlertCircle` + `paypalWebhookMissing` and `webhookError` text; always show `paypalWebhookUrl` as `<code>`.
6. `paypalSupportedCurrencies` helper text.
7. Save button (`savePaypalSettings`, spinner while `isSavingPaypal`).

Disconnect dialog: copy the Stripe disconnect `Dialog` block, bound to `showPaypalDisconnectDialog`, title `paypalDisconnectDialogTitle`, description `paypalDisconnectDialogDescription`, confirm calls `disconnectPaypal`.

- [ ] **Step 5: Build**

Run: `rtk mise exec -- timeout 30 bin/vite build`
Expected: build succeeds with no TypeScript errors. Fix any before continuing.

- [ ] **Step 6: Commit**

```bash
git add app/javascript/src/apis/api.ts app/javascript/src/components/Profile/Organization/Payment/Page.tsx app/javascript/src/i18n/locales/en.ts
git commit -m "feat(payments): PayPal card on payment settings"
```

---

### Task 9: Frontend — public invoice Pay with PayPal and invoice list

**Files:**
- Modify: `app/javascript/src/components/ClientInvoices/Details/index.tsx`
- Modify: `app/javascript/src/components/ClientInvoices/Details/Header.tsx`
- Modify: `app/javascript/src/components/ClientInvoices/Details/MobileView/index.tsx`
- Modify: `app/javascript/src/components/Invoices/List/index.tsx:256-270`
- Modify: `app/javascript/src/i18n/locales/en.ts` (`invoices` block)

- [ ] **Step 1: i18n** — add to the `invoices` block: `payWithPaypal: "Pay with PayPal"`.

- [ ] **Step 2: Details index** — destructure `paypal_payment` from `data` and pass `paypalPayment={paypal_payment}` to `Header`. `MobileView` already receives `data`.

- [ ] **Step 3: Header** — accept `paypalPayment`, compute:

```tsx
  const hasOtherProvider =
    !!stripe_connected_account ||
    !!razorpayPayment?.enabled ||
    !!upiPayment?.payment_link;
  const paypalEnabled = !!paypalPayment?.enabled && !!paypalPayment?.url;
  const paypalOnly = paypalEnabled && !hasOtherProvider;
```

In the primary PAY `onClick`, before the `setShowConnectPaymentDialog(true)` fallback, add `else if (paypalEnabled) { window.location.href = paypalPayment.url; }`. When `paypalEnabled && !paypalOnly && !isNonActionable && status !== "waived"`, render a second button after the PAY button:

```tsx
            <a
              className="ml-2 flex h-10 flex-row items-center justify-center rounded border border-primary bg-background px-4 text-sm font-semibold text-primary"
              href={paypalPayment.url}
            >
              {i18n.t("invoices.payWithPaypal")}
            </a>
```

- [ ] **Step 4: MobileView** — destructure `paypal_payment` from `data`; in the sticky footer button `onClick` use the same precedence: Razorpay → Stripe URL when `stripe_connected_account` → UPI link → PayPal URL → `url`. When PayPal is enabled alongside another provider, render a second full-width outline `Button` labelled `invoices.payWithPaypal` above the PAY button.

- [ ] **Step 5: Invoice list** — in `fetchPaymentSettings`:

```ts
      const { stripe, upi, razorpay, paypal } = res.data.providers;
      ...
      const paypalEnabledOnInvoices =
        !!paypal?.enabled && !!paypal?.connected && !!paypal?.enabledOnInvoices;

      setIsPaymentEnabled(
        stripeEnabled || upiEnabledOnInvoices || razorpayEnabledOnInvoices || paypalEnabledOnInvoices
      );
```

- [ ] **Step 6: Build**

Run: `rtk mise exec -- timeout 30 bin/vite build`
Expected: success.

- [ ] **Step 7: Commit**

```bash
git add app/javascript/src/components/ClientInvoices app/javascript/src/components/Invoices/List/index.tsx app/javascript/src/i18n/locales/en.ts
git commit -m "feat(payments): Pay with PayPal on public invoices"
```

---

### Task 10: Docs and changelog

**Files:**
- Create: `docs/product-guide/payments/04-paypal.md`
- Modify: `CHANGELOG.md` (Unreleased / Added)

- [ ] **Step 1: Product guide** (front matter `id: paypal`, `title: PayPal Setup`): sections Before You Start (PayPal Business account, REST app in Developer Dashboard), Connect PayPal (Settings → Payment Settings → PayPal, create app at `https://developer.paypal.com/dashboard/applications/live`, copy Client ID and Secret, paste, Save), Sandbox testing (toggle Sandbox mode, use sandbox app credentials and a sandbox buyer account), Webhooks (Miru registers `PAYMENT.CAPTURE.COMPLETED` and `CHECKOUT.ORDER.APPROVED` automatically at `https://app.miru.so/webhooks/paypal/events`; explain the "Webhook not registered" message), Supported currencies (list `PaymentsProvider::PAYPAL_CURRENCIES`), How clients pay (Pay with PayPal button, capture on return, invoice marked paid, confirmation emails).

- [ ] **Step 2: CHANGELOG** — under `## Unreleased` / `### Added`:

```markdown
- PayPal invoice payments: connect a PayPal REST app in Payment Settings, show Pay with PayPal on public invoices, capture on return, and reconcile through PayPal webhooks
```

- [ ] **Step 3: Commit**

```bash
git add docs/product-guide/payments/04-paypal.md CHANGELOG.md
git commit -m "docs: PayPal setup guide and changelog"
```

---

### Task 11: Full verification pass

- [ ] Run the payment suites together:

```bash
rtk mise exec -- bundle exec rspec spec/models/payments_provider_spec.rb spec/models/invoice_spec.rb spec/services/payment_providers spec/services/invoice_payment spec/requests/webhooks spec/requests/invoices spec/requests/api/v1/payment_settings_controller_spec.rb spec/requests/api/v1/invoices/view_spec.rb spec/requests/api/v1/payments
```

Expected: 0 failures.

- [ ] `rtk mise exec -- bundle exec rubocop app/services/payment_providers app/services/invoice_payment app/controllers/webhooks app/controllers/invoices/payments_controller.rb app/controllers/api/v1/payment_settings_controller.rb app/models/payments_provider.rb spec/services spec/requests/webhooks` — fix offenses.
- [ ] `rtk mise exec -- timeout 30 bin/vite build` — success.
- [ ] `rtk mise exec -- npx eslint app/javascript/src/components/Profile/Organization/Payment/Page.tsx app/javascript/src/components/ClientInvoices/Details` — no errors.
- [ ] Browser pass on the running app (done by the reviewing agent with real sandbox credentials): connect PayPal on `/settings/payment`, open a public invoice, click Pay with PayPal, pay with a sandbox buyer, land on the success page, see the payment listed under Payments, console clean.
