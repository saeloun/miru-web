# frozen_string_literal: true

require "rails_helper"

RSpec.describe ReconcileRazorpayPaymentLinksJob do
  let(:links_url) { "https://api.razorpay.com/v1/payment_links" }
  let(:json) { { "Content-Type" => "application/json" } }

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
    stub_razorpay_oauth_env
  end

  def uncertain_invoice
    company = create(:india_company, base_currency: "INR")
    owner = create(:user, current_workspace: company)
    create(:employment, company:, user: owner, resigned_at: nil)
    owner.add_role(:owner, company)
    provider = create(:payments_provider, company:, name: "razorpay", settings: { platform_fee_percent: "0" })
    connect_razorpay_oauth(provider, owner)
    PaymentProviders::RazorpayOauthConnection.new(provider:, actor: owner).update_collections!(enabled: true)
    invoice = create(:invoice, company:, client: create(:client, company:, currency: "INR"), currency: "INR",
      amount: 1000, amount_due: 1000, amount_paid: 0, status: "sent", payment_infos: {})
    stub_request(:post, links_url).to_timeout
    expect { PaymentProviders::RazorpayPaymentLinkService.new(invoice:, provider:, callback_url: "https://example.test/return").process }
      .to raise_error(PaymentProviders::RazorpayClient::Error)
    [invoice.reload, provider]
  end

  def bank_link(invoice)
    { id: "plink_#{invoice.id}", short_url: "https://rzp.io/rzp/#{invoice.id}", status: "created", amount: 100_000,
      amount_paid: 0, currency: "INR", reference_id: invoice.payment_infos.dig("razorpay_link_creation", "reference_id"),
      notes: { miru_invoice_id: invoice.id.to_s, company_id: invoice.company_id.to_s } }
  end

  def stub_recovery(invoice, status: 200, **attributes)
    link = bank_link(invoice).merge(attributes)
    lookup = stub_request(:get, "#{links_url}/").with(query: { "reference_id" => link[:reference_id] })
      .to_return(status:, body: { payment_links: [link] }.to_json, headers: json)
    stub_request(:get, "#{links_url}/#{link[:id]}").to_return(status: 200, body: link.to_json, headers: json)
    lookup
  end

  it "confirms an uncertain link without a customer visit, SMS resend or another creation, even with collections disabled" do
    invoice, provider = uncertain_invoice
    provider.update!(enabled: false, enabled_on_invoices: false)
    stub_razorpay_oauth_env(COLLECTIONS_ENABLED: "false")
    recovery = stub_recovery(invoice)
    described_class.perform_now
    expect(invoice.reload.razorpay_payment_link_id).to eq("plink_#{invoice.id}")
    expect(invoice.payment_infos).not_to have_key("razorpay_link_creation")
    expect(recovery).to have_been_requested.once
    expect(a_request(:post, links_url)).to have_been_made.once
    expect(a_request(:post, %r{/notify_by/})).not_to have_been_made
  end

  it "continues recovering another company after a provider failure" do
    failed, = uncertain_invoice
    healthy, = uncertain_invoice
    failed_lookup = stub_recovery(failed, status: 502)
    healthy_lookup = stub_recovery(healthy)
    allow(Rails.error).to receive(:report)
    described_class.perform_now
    expect(failed.reload.payment_infos).to have_key("razorpay_link_creation")
    expect(healthy.reload.razorpay_payment_link_id).to eq("plink_#{healthy.id}")
    expect(failed_lookup).to have_been_requested.once
    expect(healthy_lookup).to have_been_requested.once
    expect(Rails.error).to have_received(:report).with(an_instance_of(PaymentProviders::RazorpayClient::Error),
      hash_including(handled: true, context: hash_including(invoice_id: failed.id, company_id: failed.company_id))).once
  end

  it "repairs a failed after-commit cancellation enqueue and preserves the closed invoice's references" do
    invoice, = uncertain_invoice
    link = bank_link(invoice)
    stub_recovery(invoice)
    described_class.perform_now
    allow(CancelRazorpayPaymentLinkJob).to receive(:perform_later).and_raise(ActiveJob::EnqueueError, "synthetic queue failure")
    allow(Rails.error).to receive(:report)
    invoice.reload.update!(status: "paid", amount_paid: 1000, amount_due: 0)
    expect(Rails.error).to have_received(:report).with(an_instance_of(ActiveJob::EnqueueError), hash_including(context: { invoice_id: invoice.id }))
    cancellation = stub_request(:post, "#{links_url}/#{link[:id]}/cancel")
      .to_return(status: 200, body: link.merge(status: "cancelled").to_json, headers: json)
    described_class.perform_now
    expect(cancellation).to have_been_requested.once
    expect(invoice.reload).to have_attributes(razorpay_payment_link_status: "cancelled", razorpay_payment_link_id: link[:id],
      razorpay_payment_link_account_id: "acc_synthetic")
  end

  it "does not contact Razorpay when globally disabled or disconnected" do
    invoice, provider = uncertain_invoice
    stub_razorpay_oauth_env(ENABLED: "false")
    described_class.perform_now
    stub_razorpay_oauth_env
    provider.update!(connected: false)
    described_class.perform_now
    expect(a_request(:get, %r{api\.razorpay\.com})).not_to have_been_made
    expect(invoice.reload.payment_infos).to have_key("razorpay_link_creation")
  end

  it "retries capture reconciliation after a failure following the committed paid-link binding" do
    invoice, = uncertain_invoice
    stub_recovery(invoice, status: 200, amount_paid: 100_000)
    paid = bank_link(invoice).merge(status: "paid", amount_paid: 100_000)
    stub_request(:get, "#{links_url}/#{paid[:id]}").to_return(status: 200, body: paid.to_json, headers: json)
    calls = 0
    allow_any_instance_of(PaymentProviders::RazorpayPaymentLinkCreation).to receive(:reconcile_capture).and_wrap_original do |original, *args|
      calls += 1
      raise PaymentProviders::RazorpayClient::Error, "synthetic interruption after binding" if calls == 1

      original.call(*args)
    end
    allow(Rails.error).to receive(:report)
    described_class.perform_now
    expect(invoice.reload.razorpay_payment_link_status).to eq("paid")
    expect(invoice.payment_infos).to have_key("razorpay_link_creation")
    travel(16.seconds) { described_class.perform_now }
    expect(invoice.reload.payment_infos).not_to have_key("razorpay_link_creation")
    expect(PaymentProviders::RazorpayPaymentReview.reviews_for(invoice).values).to contain_exactly(hash_including("payment_link_id" => paid[:id]))
    expect(a_request(:post, links_url)).to have_been_made.once
  end

  it "schedules recovery every five minutes in default and production configuration" do
    configuration = YAML.safe_load(ERB.new(Rails.root.join("config/solid_queue.yml").read).result, aliases: true)
    %w[default production].each do |environment|
      expect(configuration.dig(environment, "dispatchers", 0, "recurring_tasks", "reconcile_razorpay_payment_links"))
        .to eq("class" => described_class.name, "schedule" => "*/5 * * * *")
    end
  end
end
