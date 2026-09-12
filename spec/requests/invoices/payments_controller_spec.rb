# frozen_string_literal: true

require "rails_helper"

RSpec.describe Invoices::PaymentsController, type: :request do
  let(:company) { create(:company, base_currency: "inr") }
  let(:admin) { create(:user, current_workspace_id: company.id) }
  let(:employee) { create(:user, current_workspace_id: company.id) }
  let(:client) { create(:client_with_phone_number_without_country_code, company:) }
  let!(:invoice) { create(:invoice, status: "sent", client:) }
  let!(:stripe_connected_account) { create(:stripe_connected_account, company:) }
  let(:params) { { invoice_id: invoice.external_view_key } }

  before do
    create(:employment, company:, user: admin)
    create(:employment, company:, user: employee)
    allow_any_instance_of(StripeConnectedAccount).to receive(:details_submitted).and_return(true)
  end

  describe "GET new", :vcr do
    subject { send_request :get, new_invoice_payment_path(params) }

    let(:success_path) { "/invoices/#{invoice.external_view_key}/payments/success" }
    let(:checkout_response) { Struct.new(:url).new(success_path) }

    before do
      allow(InvoicePayment::Checkout).to receive(:process).and_return(checkout_response)
    end

    context "when invoice is unpaid" do
      it "creates stripe session and redirects user to url returned by session" do
        subject

        expect(response.status).to eq 302
        expect(response).to redirect_to(success_path)
      end
    end

    context "when invoice is paid" do
      before { invoice.update(status: "paid") }

      it "redirects user to success path" do
        subject

        expect(response.status).to eq 302
        expect(response).to redirect_to(success_path)
      end
    end

    context "when Razorpay is enabled for an INR invoice", vcr: false do
      before do
        invoice.update!(currency: "INR")
        create(
          :payments_provider,
          company:,
          name: PaymentsProvider::RAZORPAY_PROVIDER,
          enabled: true,
          connected: true,
          settings: {
            key_id: "rzp_test_123",
            key_secret: "secret",
            enabled_on_invoices: true
          }
        )
        allow_any_instance_of(PaymentProviders::RazorpayPaymentLinkService)
          .to receive(:process)
          .and_return("https://rzp.io/rzp/test")
      end

      it "redirects to a Razorpay Payment Link" do
        subject

        expect(response.status).to eq 302
        expect(response).to redirect_to("https://rzp.io/rzp/test")
      end
    end

    context "when Razorpay is disabled on invoices for an INR invoice", vcr: false do
      before do
        invoice.update!(currency: "INR")
        provider = build(
          :payments_provider,
          company:,
          name: PaymentsProvider::RAZORPAY_PROVIDER,
          enabled: true,
          connected: true,
          settings: {
            key_id: "rzp_test_123",
            enabled_on_invoices: false
          }
        )
        provider.key_secret = "secret"
        provider.save!
      end

      it "falls back to Stripe checkout" do
        expect_any_instance_of(PaymentProviders::RazorpayPaymentLinkService)
          .not_to receive(:process)

        subject

        expect(response.status).to eq 302
        expect(response).to redirect_to(success_path)
      end
    end

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
  end

  describe "GET paypal_return", vcr: false do
    it "captures the order and redirects to the success page" do
      fulfillment = instance_double(InvoicePayment::PaypalCaptureFulfillment, error: nil)
      allow(fulfillment).to receive(:process) do
        invoice.update!(status: "paid", amount_due: 0, amount_paid: invoice.amount)
        true
      end
      expect(InvoicePayment::PaypalCaptureFulfillment).to receive(:new).with(invoice:, order_id: "ORDER-1").and_return(fulfillment)

      send_request :get, paypal_return_invoice_payments_path(params.merge(token: "ORDER-1", PayerID: "PAYER"))

      expect(response).to redirect_to("http://www.example.com/invoices/#{invoice.external_view_key}/payments/success?provider=paypal")
    end

    it "sends the payer back to the invoice when the capture only part pays it" do
      fulfillment = instance_double(InvoicePayment::PaypalCaptureFulfillment, process: true, error: nil)
      allow(InvoicePayment::PaypalCaptureFulfillment).to receive(:new).and_return(fulfillment)

      send_request :get, paypal_return_invoice_payments_path(params.merge(token: "ORDER-1"))

      expect(response).to redirect_to("http://www.example.com/invoices/#{invoice.external_view_key}/view")
    end

    it "warns the payer instead of offering a second payment when the capture fails" do
      fulfillment = instance_double(InvoicePayment::PaypalCaptureFulfillment, process: false, error: "Instrument declined")
      allow(InvoicePayment::PaypalCaptureFulfillment).to receive(:new).and_return(fulfillment)

      send_request :get, paypal_return_invoice_payments_path(params.merge(token: "ORDER-1"))

      expect(response).to redirect_to(cancel_invoice_payments_url(invoice.external_view_key, reason: "capture"))

      follow_redirect!
      expect(response.body).to include("We could not confirm your payment")
      expect(response.body).not_to include("Try again")
    end
  end

  describe "GET success", :vcr do
    before do
      # Mock Stripe account instead of creating real one
      account = OpenStruct.new(
        id: "acct_test_#{SecureRandom.hex(8)}",
        type: "custom",
        country: "US",
        email: "jenny.rosen@example.com",
        business_type: "company",
        company: {
          name: "test company"
        },
        business_profile: {
          name: "test company",
          url: "https://exampletest.com"
        },
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true }
        }
      )

      stripe_connected_account.update_columns(account_id: account.id)

      invoice.create_checkout_session!(
        success_url: "https://example.com/invoices/#{invoice.external_view_key}/payments/success",
        cancel_url: cancel_invoice_payments_url(invoice.external_view_key)
      )
    end

    subject { send_request :get, "/invoices/#{invoice.external_view_key}/payments/success" }

    it "doesn't mark invoice status as paid" do
      expect(invoice.status).not_to eq "paid"
      subject
      expect(response.status).to eq 200
      invoice.reload
      expect(invoice.status).to eq "sent"
    end
  end

  describe "GET cancel", :vcr do
    subject { send_request :get, cancel_invoice_payments_path(params) }

    it "renders time tracking page with status 200" do
      subject

      expect(response.status).to eq 200
      expect(response.body).to include("Time tracking and invoicing")
    end
  end

  it "does not accept a numeric invoice id" do
    send_request :get, new_invoice_payment_path(invoice_id: invoice.id)

    expect(response).to have_http_status(:not_found)
  end
end
