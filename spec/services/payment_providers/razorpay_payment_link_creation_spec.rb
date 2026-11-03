# frozen_string_literal: true

require "rails_helper"

RSpec.describe PaymentProviders::RazorpayPaymentLinkService, "durable OAuth link creation" do
  let(:company) { create(:india_company, base_currency: "INR") }
  let(:owner) { create(:user, current_workspace: company) }
  let(:provider) { create(:payments_provider, company:, name: "razorpay", settings: { platform_fee_percent: "0" }) }
  let(:customer) { create(:client, company:, currency: "INR", name: "Synthetic customer", email: "customer@example.test") }
  let(:invoice) do
    create(:invoice, company:, client: customer, currency: "INR", amount: 1000, amount_due: 1000,
      amount_paid: 0, status: "sent", payment_infos: {})
  end
  let(:links_url) { "https://api.razorpay.com/v1/payment_links" }
  let(:json) { { "Content-Type" => "application/json" } }
  let(:references) { [] }

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
    PaymentProviders::RazorpayOauthConnection.new(provider:, actor: owner).update_collections!(enabled: true)
  end

  def service
    described_class.new(invoice: Invoice.find(invoice.id), provider: PaymentsProvider.find(provider.id),
      callback_url: "https://example.test/razorpay-return")
  end

  def creation_request
    stub_request(:post, links_url).with do |request|
      references << JSON.parse(request.body).fetch("reference_id")
      true
    end
  end

  def lookup(links)
    stub_request(:get, "#{links_url}/").with(query: { "reference_id" => references.first })
      .to_return(status: 200, body: { payment_links: links }.to_json, headers: json)
  end

  def created_link
    { id: "plink_recovered", status: "created", short_url: "https://rzp.io/rzp/recovered", amount: 100_000, amount_paid: 0,
      currency: "INR", reference_id: references.first, notes: { miru_invoice_id: invoice.id.to_s, company_id: company.id.to_s } }
  end

  def recover(payment_link_id: nil)
    PaymentProviders::RazorpayPaymentLinkCreation.new(invoice: invoice.reload, provider: provider.reload).recover!(payment_link_id:)
  end

  it "does not issue another payable link after a timeout and an empty lookup" do
    creation = creation_request.to_timeout
    expect { service.process }.to raise_error(PaymentProviders::RazorpayClient::Error)
    recovery = lookup([])
    expect { service.process }.to raise_error(PaymentProviders::RazorpayClient::Error)
    expect(creation).to have_been_requested.once
    expect(recovery).to have_been_requested.once
    expect(references.uniq).to eq([references.first])
  end

  it "recovers the remotely created link by its original reference instead of creating another" do
    creation = creation_request.to_timeout
    expect { service.process }.to raise_error(PaymentProviders::RazorpayClient::Error)
    recovery = lookup([created_link])
    stub_request(:get, "#{links_url}/plink_recovered").to_return(status: 200, body: created_link.to_json, headers: json)
    expect(service.process).to eq("https://rzp.io/rzp/recovered")
    expect(creation).to have_been_requested.once
    expect(recovery).to have_been_requested.once
    expect(invoice.reload).to have_attributes(razorpay_payment_link_id: "plink_recovered", razorpay_payment_link_account_id: "acc_synthetic")
  end

  it "commits the sent intent before HTTP so a worker death cannot erase it" do
    invoice_id = invoice.id
    observed = nil
    creation_request.to_return do
      parent_pid = ActiveRecord::Base.connection.select_value("SELECT pg_backend_pid()")
      reader = Thread.new do
        ActiveRecord::Base.connection_pool.with_connection do |database|
          expect(database.select_value("SELECT pg_backend_pid()")).not_to eq(parent_pid)
          expect(Invoice.connection).to equal(database)
          Invoice.find(invoice_id).payment_infos["razorpay_link_creation"]
        end
      end
      observed = Timeout.timeout(5) { reader.value }
      raise Interrupt
    end
    expect { service.process }.to raise_error(Interrupt)
    expect(observed).to include("reference_id" => references.first, "state" => "sent")
    expect(invoice.reload.payment_infos["razorpay_link_creation"]).to eq(observed)
  end

  it "allows a fresh attempt after a documented input rejection" do
    calls = 0
    creation = creation_request.to_return do |request|
      calls += 1
      body = if calls == 1
        { error: { code: "BAD_REQUEST_ERROR", description: "wrong input fields sent." } }
      else
        created_link.merge(reference_id: JSON.parse(request.body).fetch("reference_id"))
      end
      { status: calls == 1 ? 400 : 200, body: body.to_json, headers: json }
    end
    expect { service.process }.to raise_error(PaymentProviders::RazorpayClient::CreationRejected)
    expect(invoice.reload.payment_infos).not_to have_key("razorpay_link_creation")
    expect(service.process).to eq("https://rzp.io/rzp/recovered")
    expect(creation).to have_been_requested.twice
    expect(references.uniq.size).to eq(2)
  end

  ["payment link creation with reference ID already attempted", "an undocumented provider error"].each do |description|
    it "retains the intent after #{description}" do
      creation = creation_request.to_return(status: 400,
        body: { error: { code: "BAD_REQUEST_ERROR", description: } }.to_json, headers: json)
      expect { service.process }.to raise_error(PaymentProviders::RazorpayPaymentLinkService::PaymentConfirming)
      lookup([])
      expect { service.process }.to raise_error(PaymentProviders::RazorpayPaymentLinkService::PaymentConfirming)
      expect(creation).to have_been_requested.once
      expect(invoice.reload.payment_infos).to have_key("razorpay_link_creation")
    end
  end

  it "does not call the API for a different account selected before HTTP" do
    creation = creation_request.to_timeout
    allow_any_instance_of(PaymentProviders::RazorpayClient).to receive(:create_payment_link).and_wrap_original do |original, *args, **keywords|
      provider.reload.update!(settings: provider.settings.merge("oauth_account_id" => "acc_other"))
      original.call(*args, **keywords)
    end
    expect { service.process }.to raise_error(PaymentProviders::RazorpayClient::NotSent)
    expect(creation).not_to have_been_requested
    expect(invoice.reload.payment_infos).not_to have_key("razorpay_link_creation")
  end

  it "retains the returned link after disconnect during HTTP without returning its URL" do
    creation_request.to_return do |request|
      provider.update!(connected: false, enabled: false, enabled_on_invoices: false)
      { status: 200, body: created_link.merge(reference_id: JSON.parse(request.body).fetch("reference_id")).to_json, headers: json }
    end
    expect { service.process }.to raise_error(PaymentProviders::RazorpayPaymentLinkService::PaymentConfirming)
    expect(invoice.reload.razorpay_payment_link_id).to eq("plink_recovered")
    expect(invoice.payment_infos).not_to have_key("razorpay_link_creation")
  end

  it "refuses an enclosing transaction before any creation attempt is persisted or sent" do
    invoice
    creation = creation_request.to_timeout
    expect { Invoice.transaction { service.process } }.to raise_error(PaymentProviders::RazorpayClient::NotSent)
    expect(creation).not_to have_been_requested
    expect(invoice.reload.payment_infos).not_to have_key("razorpay_link_creation")
  end

  it "blocks permanent deletion while creation is uncertain" do
    creation_request.to_timeout
    expect { service.process }.to raise_error(PaymentProviders::RazorpayClient::Error)
    expect { invoice.reload.destroy }.not_to change { Invoice.exists?(invoice.id) }
  end

  it "does not keep creating links if Razorpay immediately returns an expired link" do
    calls = 0
    creation = creation_request.to_return do |request|
      calls += 1
      raise Net::ReadTimeout if calls > 2

      { status: 200, body: created_link.merge(status: "expired", reference_id: JSON.parse(request.body).fetch("reference_id")).to_json, headers: json }
    end
    expect { service.process }.to raise_error(PaymentProviders::RazorpayPaymentLinkService::PaymentConfirming)
    expect(creation).to have_been_requested.once
  end

  it "keeps a capture reported with a closed creation response visible for review" do
    creation_request.to_return do
      { status: 200, body: created_link.merge(status: "expired", payments: [{ payment_id: "pay_closed", status: "captured", amount: 50_000 }]).to_json, headers: json }
    end
    expect { service.process }.to raise_error(PaymentProviders::RazorpayPaymentLinkService::PaymentConfirming)
    expect(PaymentProviders::RazorpayPaymentReview.reviews_for(invoice.reload).values).to contain_exactly(hash_including("payment_id" => "pay_closed"))
    expect(invoice.razorpay_payment_link_id).to eq("plink_recovered")
  end

  it "throttles an empty lookup without clearing the attempt or resending SMS" do
    creation = creation_request.to_timeout
    expect { service.process }.to raise_error(PaymentProviders::RazorpayClient::Error)
    recovery = lookup([])
    2.times { expect(recover).to be_nil }
    travel(16.seconds) { expect(recover).to be_nil }
    expect(recovery).to have_been_requested.twice
    expect(creation).to have_been_requested.once
    expect(a_request(:post, %r{/notify_by/})).not_to have_been_made
    expect(invoice.reload.payment_infos).to have_key("razorpay_link_creation")
  end

  [nil, {}, [{ id: "invalid" }], [{ id: "plink_one" }, { id: "plink_two" }]].each do |links|
    it "keeps an uncertain creation blocked after an invalid or ambiguous lookup #{links.inspect}" do
      creation = creation_request.to_timeout
      expect { service.process }.to raise_error(PaymentProviders::RazorpayClient::Error)
      lookup(links)
      expect { recover }.to raise_error(PaymentProviders::RazorpayClient::Error)
      expect(invoice.reload.payment_infos).to have_key("razorpay_link_creation")
      expect(creation).to have_been_requested.once
      expect(a_request(:get, %r{/payment_links/plink_})).not_to have_been_made
    end
  end

  {
    reference_id: "another-reference", amount: 99_999, currency: "USD", status: "unknown",
    short_url: "https://user:password@rzp.io/link", notes: { miru_invoice_id: "0", company_id: "0" }
  }.each do |field, value|
    it "rejects a manually supplied link with mismatched #{field}" do
      creation = creation_request.to_timeout
      expect { service.process }.to raise_error(PaymentProviders::RazorpayClient::Error)
      stub_request(:get, "#{links_url}/plink_recovered").to_return(status: 200, body: created_link.merge(field => value).to_json, headers: json)
      expect { recover(payment_link_id: "plink_recovered") }.to raise_error(PaymentProviders::RazorpayClient::Error)
      expect(invoice.reload.razorpay_payment_link_id).to be_nil
      expect(invoice.payment_infos).to have_key("razorpay_link_creation")
      expect(creation).to have_been_requested.once
    end
  end

  it "allows a verified manual link ID after an empty reference lookup" do
    creation = creation_request.to_timeout
    expect { service.process }.to raise_error(PaymentProviders::RazorpayClient::Error)
    lookup([])
    expect(recover).to be_nil
    stub_request(:get, "#{links_url}/plink_recovered").to_return(status: 200, body: created_link.to_json, headers: json)
    expect(recover(payment_link_id: "plink_recovered")).to include("id" => "plink_recovered")
    expect(invoice.reload.payment_infos).not_to have_key("razorpay_link_creation")
    expect(creation).to have_been_requested.once
  end

  it "rejects a different resource ID returned by a manual lookup" do
    creation_request.to_timeout
    expect { service.process }.to raise_error(PaymentProviders::RazorpayClient::Error)
    stub_request(:get, "#{links_url}/plink_recovered").to_return(status: 200, body: created_link.merge(id: "plink_different").to_json, headers: json)
    expect { recover(payment_link_id: "plink_recovered") }.to raise_error(PaymentProviders::RazorpayClient::Error)
    expect(invoice.reload.payment_infos).to have_key("razorpay_link_creation")
    expect(invoice.razorpay_payment_link_id).to be_nil
  end

  it "hides a recovered link whose invoice amount changed until the old link is cancelled" do
    creation_request.to_timeout
    expect { service.process }.to raise_error(PaymentProviders::RazorpayClient::Error)
    invoice.reload.update!(amount_due: 500)
    stub_request(:get, "#{links_url}/plink_recovered").to_return(status: 200, body: created_link.to_json, headers: json)
    expect(recover(payment_link_id: "plink_recovered")).to include("id" => "plink_recovered")
    expect(invoice.reload.razorpay_payment_link_url).to eq("https://rzp.io/rzp/recovered")
    expect(invoice.payable_razorpay_payment_link_url).to be_nil
    expect(CancelRazorpayPaymentLinkJob).to have_been_enqueued.with(invoice.id, "plink_recovered", "acc_synthetic")
  end

  it "retains a late created link and queues closure when the invoice is archived during HTTP" do
    creation_request.to_return do
      invoice.discard!
      { status: 200, body: created_link.to_json, headers: json }
    end
    expect { service.process }.to raise_error(PaymentProviders::RazorpayPaymentLinkService::PaymentConfirming)
    expect(invoice.reload.razorpay_payment_link_id).to eq("plink_recovered")
    expect(invoice).to be_discarded
    expect(CancelRazorpayPaymentLinkJob).to have_been_enqueued.with(invoice.id, "plink_recovered", "acc_synthetic")
  end

  it "does not allow API keys to bypass an uncertain attempt after disconnect" do
    creation_request.to_timeout
    expect { service.process }.to raise_error(PaymentProviders::RazorpayClient::Error)
    provider.reload.update!(connected: false, settings: { "authentication_mode" => "api_key", "key_id" => "rzp_test_synthetic", "key_secret" => "synthetic-key" })
    expect(provider.reload.razorpay_oauth_in_use?).to be(true)
    expect { service.process }.to raise_error(PaymentProviders::RazorpayPaymentLinkService::PaymentConfirming)
  end

  it "preserves a new intent when an older legacy webhook writes payment information" do
    legacy_company = create(:india_company, base_currency: "INR")
    create(:payments_provider, company: legacy_company, name: "razorpay", enabled: true, connected: true,
      settings: { key_id: "rzp_test_synthetic", key_secret: "synthetic-key", webhook_secret: "synthetic-webhook" })
    legacy_invoice = create(:invoice, company: legacy_company, client: create(:client, company: legacy_company, currency: "INR"), currency: "INR",
      payment_infos: { "razorpay_payment_link_id" => "plink_legacy", "razorpay_payment_link_status" => "created" })
    payload = { event: "payment_link.cancelled", payload: { payment_link: { entity: {
      id: "plink_legacy", status: "cancelled", notes: { miru_invoice_id: legacy_invoice.id.to_s }
    } } } }.to_json
    marker = { "reference_id" => "miru-#{SecureRandom.uuid.delete('-')}", "state" => "sent" }
    allow(Razorpay::Utility).to receive(:verify_webhook_signature).and_wrap_original do |original, *args|
      result = original.call(*args)
      record = Invoice.find(legacy_invoice.id)
      record.update!(payment_infos: record.payment_infos.merge("razorpay_link_creation" => marker))
      result
    end
    signature = OpenSSL::HMAC.hexdigest("SHA256", "synthetic-webhook", payload)
    expect(InvoicePayment::RazorpayPaymentLinkWebhookFulfillment.new(payload:, signature:).process).to be(true)
    expect(legacy_invoice.reload.payment_infos["razorpay_link_creation"]).to eq(marker)
  end
end
