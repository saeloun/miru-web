# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Api::V1::Mobile::Collections#create", type: :request do
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

  it "forbids employees" do
    user.remove_role :admin, company
    user.add_role :employee, company

    post "/api/v1/mobile/collections",
      params: { collection: { name: "Asha Rao", phone: "9876543210" } },
      headers: auth_headers(user)

    expect(response).to have_http_status(:forbidden)
  end
end
