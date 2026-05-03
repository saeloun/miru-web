# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Api::V1::Mobile::Collections", type: :request do
  let(:company) { create(:india_company, base_currency: "INR", plan_tier: "paid") }
  let(:user) { create(:user, current_workspace_id: company.id) }
  let(:service) { instance_double(PaymentProviders::RazorpayPaymentLinkService, process: "https://rzp.io/rzp/mobile", sms_sent?: true) }

  before do
    create(:employment, company:, user:)
    user.add_role :admin, company
    sign_in user
  end

  it "creates a phone-only payer without requiring email" do
    post "/api/v1/mobile/collections",
      params: { collection: { name: "Asha Rao", phone: "9876543210" } },
      headers: auth_headers(user)

    customer = User.find_by(phone: "+919876543210")
    client = Client.find_by!(company:, phone: "+919876543210")

    expect(response).to have_http_status(:created)
    expect(json_response.dig("client", "name")).to eq("Asha Rao")
    expect(json_response.dig("client", "phone")).to eq("+919876543210")
    expect(json_response.dig("customer_user", "id")).to eq(customer.id)
    expect(customer).to be_confirmed
    expect(customer).to have_role(:client, company)
    expect(company.client_members.exists?(client:, user: customer)).to eq(true)
    expect(json_response["invoice"]).to be_nil
  end

  it "creates an INR invoice and sends a Razorpay payment link SMS" do
    provider = create_razorpay_provider!
    allow(PaymentProviders::RazorpayPaymentLinkService).to receive(:new).and_return(service)

    post "/api/v1/mobile/collections",
      params: {
        collection: {
          amount: "1500",
          create_payment_link: true,
          name: "Asha Rao",
          note: "Adjustment session",
          notify_sms: true,
          phone: "+91 98765 43210"
        }
      },
      headers: auth_headers(user)

    invoice = Invoice.last
    expect(response).to have_http_status(:accepted)
    expect(json_response).to include(
      "message" => "Payment link sent by SMS",
      "payment_link_url" => "https://rzp.io/rzp/mobile",
      "sms_sent" => true
    )
    expect(json_response.dig("invoice", "amount_due")).to eq("1500.0")
    expect(invoice).to be_sent
    expect(invoice.currency).to eq("INR")
    expect(PaymentProviders::RazorpayPaymentLinkService).to have_received(:new).with(
      invoice:,
      provider:,
      callback_url: razorpay_success_invoice_payments_url(invoice),
      notify_sms: true
    )
  end

  it "creates a Razorpay link on an idempotent retry when the invoice already exists" do
    provider = create_razorpay_provider!
    link_service = instance_double(PaymentProviders::RazorpayPaymentLinkService, process: "https://rzp.io/rzp/retry", sms_sent?: false)
    allow(PaymentProviders::RazorpayPaymentLinkService).to receive(:new).and_return(link_service)

    post "/api/v1/mobile/collections",
      params: {
        collection: {
          amount: "1500",
          idempotency_key: "retry-link-1500",
          name: "Asha Rao",
          phone: "+91 98765 43210"
        }
      },
      headers: auth_headers(user)

    invoice = Invoice.last
    expect(invoice.razorpay_payment_link_url).to be_blank

    expect do
      post "/api/v1/mobile/collections",
        params: {
          collection: {
            amount: "1500",
            create_payment_link: true,
            idempotency_key: "retry-link-1500",
            name: "Asha Rao",
            phone: "+91 98765 43210"
          }
        },
        headers: auth_headers(user)
    end.not_to change(Invoice, :count)

    expect(response).to have_http_status(:ok)
    expect(json_response).to include(
      "message" => "Payment link ready",
      "payment_link_url" => "https://rzp.io/rzp/retry",
      "sms_sent" => false
    )
    expect(PaymentProviders::RazorpayPaymentLinkService).to have_received(:new).with(
      invoice:,
      provider:,
      callback_url: razorpay_success_invoice_payments_url(invoice),
      notify_sms: false
    )
  end

  it "reuses an existing payer by normalized phone number" do
    existing_client = create(:client, company:, name: "Existing", phone: "+919876543210", currency: "INR")

    post "/api/v1/mobile/collections",
      params: { collection: { name: "Asha Rao", phone: "9876543210" } },
      headers: auth_headers(user)

    expect(response).to have_http_status(:created)
    expect(Client.where(company:).count).to eq(1)
    expect(json_response.dig("client", "id")).to eq(existing_client.id)
  end

  it "reuses an existing customer login by phone without creating duplicates" do
    existing_customer = create(:user, current_workspace_id: company.id, phone: "+919876543210")
    existing_customer.add_role :client, company
    create(:employment, company:, user: existing_customer)

    2.times do
      post "/api/v1/mobile/collections",
        params: { collection: { name: "Asha Rao", phone: "9876543210" } },
        headers: auth_headers(user)
    end

    client = Client.find_by!(company:, phone: "+919876543210")
    expect(response).to have_http_status(:created)
    expect(json_response.dig("customer_user", "id")).to eq(existing_customer.id)
    expect(User.where(phone: "+919876543210").count).to eq(1)
    expect(company.client_members.where(client:, user: existing_customer).count).to eq(1)
  end

  it "creates a synthetic customer email when only name and phone are provided" do
    post "/api/v1/mobile/collections",
      params: { collection: { name: "Asha Rao", phone: "9876543210" } },
      headers: auth_headers(user)

    expect(response).to have_http_status(:created)
    expect(json_response.dig("customer_user", "email")).to eq("customer-#{company.id}-919876543210@customers.miru.local")
  end

  it "allows employees on pro teams to collect payments in the field" do
    user.remove_role :admin, company
    user.add_role :employee, company

    post "/api/v1/mobile/collections",
      params: {
        collection: {
          amount: "3000",
          idempotency_key: "employee-collection-1",
          name: "Asha Rao",
          payment_method: "upi",
          phone: "9876543210"
        }
      },
      headers: auth_headers(user)

    invoice = Invoice.last

    expect(response).to have_http_status(:created)
    expect(json_response["message"]).to eq("UPI payment recorded")
    expect(invoice).to be_paid
    expect(invoice.payments.last.transaction_type).to eq("upi")
  end

  it "forbids mobile collections for non-pro teams" do
    company.update!(plan_tier: "free")

    post "/api/v1/mobile/collections",
      params: { collection: { name: "Asha Rao", phone: "9876543210" } },
      headers: auth_headers(user)

    expect(response).to have_http_status(:forbidden)
  end

  it "records manual cash and upi payments against the invoice" do
    post "/api/v1/mobile/collections",
      params: {
        collection: {
          amount: "1800",
          manual_reference: "UPI123",
          name: "Asha Rao",
          note: "Home visit",
          payment_method: "upi",
          phone: "9876543210"
        }
      },
      headers: auth_headers(user)

    invoice = Invoice.last
    payment = invoice.payments.last

    expect(response).to have_http_status(:created)
    expect(json_response.dig("payment", "transaction_type")).to eq("upi")
    expect(json_response.dig("invoice", "status")).to eq("paid")
    expect(invoice).to be_paid
    expect(payment.amount).to eq(1800)
    expect(payment.note).to include("UPI ref: UPI123")
  end

  it "does not duplicate invoices for idempotent mobile collection retries" do
    payload = {
      collection: {
        amount: "3000",
        idempotency_key: "retry-key-3000",
        name: "Asha Rao",
        payment_method: "upi",
        phone: "9876543210"
      }
    }

    expect do
      2.times do
        post "/api/v1/mobile/collections",
          params: payload,
          headers: auth_headers(user)
      end
    end.to change(Invoice, :count).by(1)
      .and change(Payment, :count).by(1)

    expect(response).to have_http_status(:ok)
    expect(json_response.dig("invoice", "invoice_number")).to eq(Invoice.last.invoice_number)
  end

  it "lists the collection ledger for managers" do
    paid_invoice = create_mobile_collection_invoice(amount: 3000, collector: user)
    InvoicePayment::Settle.process(
      {
        invoice_id: paid_invoice.id,
        transaction_date: Date.current,
        transaction_type: "upi",
        amount: 3000,
        note: "UPI ref: 101",
        name: user.full_name
      },
      paid_invoice
    )

    create_mobile_collection_invoice(amount: 1200, collector: user)

    get "/api/v1/mobile/collections", headers: auth_headers(user)

    expect(response).to have_http_status(:ok)
    expect(json_response["collections"].size).to eq(2)
    expect(json_response.dig("summary", "count")).to eq(2)
    expect(json_response.dig("summary", "paid_count")).to eq(1)
    expect(json_response.dig("summary", "by_method", "upi")).to eq("3000.0")
    expect(json_response.dig("collections", 0, "collector", "id")).to eq(user.id)
  end

  it "limits employees to their own collection ledger" do
    other_user = create(:user, current_workspace_id: company.id)
    create(:employment, company:, user: other_user)
    other_user.add_role :employee, company
    user.remove_role :admin, company
    user.add_role :employee, company

    own_invoice = create_mobile_collection_invoice(amount: 3000, collector: user)
    create_mobile_collection_invoice(amount: 1200, collector: other_user)

    get "/api/v1/mobile/collections", headers: auth_headers(user)

    expect(response).to have_http_status(:ok)
    expect(json_response["collections"].size).to eq(1)
    expect(json_response.dig("collections", 0, "invoice", "id")).to eq(own_invoice.id)
  end

  def create_mobile_collection_invoice(amount:, collector:)
    client = create(:client, company:, currency: "INR")

    create(
      :invoice,
      company:,
      client:,
      amount_value: amount,
      currency: "INR",
      status: :sent,
      payment_infos: {
        mobile_collection_source: "mobile",
        mobile_collector_user_id: collector.id.to_s,
        mobile_collector_name: collector.full_name
      }
    )
  end

  def create_razorpay_provider!
    provider = build(
      :payments_provider,
      company:,
      name: PaymentsProvider::RAZORPAY_PROVIDER,
      connected: true,
      enabled: true,
      accepted_payment_methods: ["razorpay"],
      settings: {
        enabled_on_invoices: true,
        key_id: "rzp_test_123",
        sms_notifications_enabled: true
      }
    )
    provider.key_secret = "secret"
    provider.save!
    provider
  end
end
