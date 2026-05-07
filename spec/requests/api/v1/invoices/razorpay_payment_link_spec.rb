# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Api::V1::Invoices#razorpay_payment_link", type: :request do
  let(:company) { create(:india_company, base_currency: "INR", plan_tier: "paid") }
  let(:client) { create(:client, company:, currency: "INR", phone: "+919876543210") }
  let(:invoice) { create(:invoice, company:, client:, currency: "INR", amount: 1200, amount_due: 1200, status: "sent") }
  let(:user) { create(:user, current_workspace_id: company.id) }
  let(:provider) do
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
  let(:service) { instance_double(PaymentProviders::RazorpayPaymentLinkService, process: "https://rzp.io/rzp/test", sms_sent?: false) }

  before do
    create(:employment, company:, user:)
    user.add_role :admin, company
    sign_in user
    provider
    allow(PaymentProviders::RazorpayPaymentLinkService).to receive(:new).and_return(service)
  end

  it "creates a Razorpay payment link for an INR invoice" do
    post "/api/v1/invoices/#{invoice.id}/razorpay_payment_link", headers: auth_headers(user)

    expect(response).to have_http_status(:ok)
    expect(json_response).to include(
      "message" => "Razorpay payment link ready",
      "payment_link_url" => "https://rzp.io/rzp/test",
      "sms_sent" => false
    )
    expect(PaymentProviders::RazorpayPaymentLinkService).to have_received(:new).with(
      invoice: invoice,
      provider: provider,
      callback_url: razorpay_success_invoice_payments_url(invoice),
      notify_sms: false
    )
  end

  it "sends the Razorpay payment link by SMS when enabled for Indian pro workspaces" do
    allow(service).to receive(:sms_sent?).and_return(true)

    post "/api/v1/invoices/#{invoice.id}/razorpay_payment_link", params: { notify_sms: true }, headers: auth_headers(user)

    expect(response).to have_http_status(:accepted)
    expect(json_response).to include(
      "message" => "Razorpay payment link sent by SMS",
      "payment_link_url" => "https://rzp.io/rzp/test",
      "sms_sent" => true
    )
    expect(PaymentProviders::RazorpayPaymentLinkService).to have_received(:new).with(
      invoice: invoice,
      provider: provider,
      callback_url: razorpay_success_invoice_payments_url(invoice),
      notify_sms: true
    )
  end

  it "rejects SMS when the workspace is not Indian pro" do
    company.update!(plan_tier: "free")

    post "/api/v1/invoices/#{invoice.id}/razorpay_payment_link", params: { notify_sms: true }, headers: auth_headers(user)

    expect(response).to have_http_status(:unprocessable_content)
    expect(json_response["error"]).to eq("SMS payment links are not enabled for this workspace")
  end

  it "rejects SMS when the client has no phone number" do
    client.update!(phone: nil)

    post "/api/v1/invoices/#{invoice.id}/razorpay_payment_link", params: { notify_sms: true }, headers: auth_headers(user)

    expect(response).to have_http_status(:unprocessable_content)
    expect(json_response["error"]).to eq("Client phone is required to send SMS payment links")
  end

  it "rejects non-INR invoices" do
    invoice.update!(currency: "USD")

    post "/api/v1/invoices/#{invoice.id}/razorpay_payment_link", headers: auth_headers(user)

    expect(response).to have_http_status(:unprocessable_content)
    expect(json_response["error"]).to eq("Razorpay payments are available only for INR invoices")
  end

  context "when user is an employee" do
    before do
      user.remove_role :admin, company
      user.add_role :employee, company
    end

    it "is forbidden" do
      post "/api/v1/invoices/#{invoice.id}/razorpay_payment_link", headers: auth_headers(user)

      expect(response).to have_http_status(:forbidden)
    end
  end
end
