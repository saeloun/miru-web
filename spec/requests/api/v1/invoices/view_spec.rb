# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Api::V1::Invoices::View#index", type: :request do
  describe "#show" do
    let(:company) { create(:company, :with_logo) }
    let(:client) { create(:client, company:) }
    let(:invoice) { create(:invoice, client:, company:, status: "sent") }

    context "when unauthenticated" do
      context "with an unresolved payment" do
        let(:company) do
          create(:india_company, :with_logo, base_currency: "INR", bank_name: "Synthetic Bank", bank_account_number: "12345678")
        end
        let(:client) { create(:client, company:, currency: "INR") }
        let(:invoice) { create(:invoice, company:, client:, currency: "INR", status: "sent", payment_infos: {}) }

        before do
          create(:payments_provider, company:, name: "upi", enabled: true, connected: true,
            settings: { upi_id: "synthetic@upi", payee_name: "Synthetic Collections", enabled_on_invoices: true })
        end

        {
          "creation" => { "razorpay_link_creation" => { "reference_id" => "miru-#{'a' * 32}" } },
          "capture review" => { "razorpay_payment_reviews" => { "pay_review" => { "payment_id" => "pay_review" } },
            "razorpay_payment_link_id" => "plink_closed", "razorpay_payment_link_account_id" => "acc_original", "razorpay_payment_link_status" => "cancelled" },
          "disconnected bound link" => { "razorpay_payment_link_id" => "plink_bound", "razorpay_payment_link_account_id" => "acc_original" }
        }.each do |state, infos|
          it "withholds alternative payment instructions for an unresolved #{state}" do
            invoice.update!(payment_infos: infos)
            send_request :get, api_v1_invoices_view_path(invoice.external_view_key)

            expect(response).to be_successful
            expect(json_response.dig("invoice", "payment_on_hold")).to be(true)
            expect(json_response["upi_payment"]).to be_blank
            expect(json_response.dig("bank_payment", "enabled")).to be(false)
            expect(json_response.dig("bank_payment", "bank_account_number")).to be_nil
            expect(json_response["invoice"]).not_to have_key("payment_infos")
          end
        end

        it "retains the payment options for an invoice without a hold" do
          send_request :get, api_v1_invoices_view_path(invoice.external_view_key)

          expect(json_response.dig("invoice", "payment_on_hold")).to be(false)
          expect(json_response.dig("upi_payment", "payment_link")).to end_with("/invoices/#{invoice.external_view_key}/payments/new?provider=upi")
          expect(json_response.dig("bank_payment", "enabled")).to be(true)
        end

        it "rechecks a previously displayed UPI option when the invoice acquires a hold" do
          send_request :get, api_v1_invoices_view_path(invoice.external_view_key)
          checkout = URI.parse(json_response.dig("upi_payment", "payment_link")).request_uri
          invoice.update!(payment_infos: { "razorpay_link_creation" => { "reference_id" => "miru-#{'a' * 32}" } })
          send_request :get, checkout

          expect(response).to redirect_to(cancel_invoice_payments_url(invoice.external_view_key, reason: "confirming"))
          expect(a_request(:post, %r{api\.razorpay\.com})).not_to have_been_made
        end

        it "opens UPI through guarded checkout when the invoice is payable" do
          send_request :get, new_invoice_payment_path(invoice.external_view_key, provider: "upi")

          expect(response).to have_http_status(:found)
          expect(response.location).to start_with("upi://pay?")
          expect(response.location).to include("pa=synthetic%40upi")
        end

        it "does not fall back to a different payment provider if UPI is unavailable" do
          company.payments_providers.find_by!(name: "upi").update!(enabled: false)
          expect_any_instance_of(Invoice).not_to receive(:create_checkout_session!)
          send_request :get, new_invoice_payment_path(invoice.external_view_key, provider: "upi")

          expect(response).to redirect_to(cancel_invoice_payments_url(invoice.external_view_key, reason: "start"))
        end

        [{ status: "paid", amount_due: 0 }, { status: "waived" }, { amount_due: 0 }].each do |attributes|
          it "withholds payment instructions without claiming a hold for #{attributes}" do
            invoice.update!(attributes)
            send_request :get, api_v1_invoices_view_path(invoice.external_view_key)

            expect(json_response.dig("invoice", "payment_on_hold")).to be(false)
            expect(json_response["upi_payment"]).to be_blank
            expect(json_response.dig("bank_payment", "enabled")).to be(false)
            expect(json_response.dig("bank_payment", "bank_account_number")).to be_nil
          end
        end

        it "does not describe a paid invoice as uncertain after its original Razorpay account disconnects" do
          invoice.update!(status: "paid", amount_due: 0, payment_infos: {
            "razorpay_payment_link_id" => "plink_paid", "razorpay_payment_link_account_id" => "acc_original", "razorpay_payment_link_status" => "paid"
          })
          send_request :get, api_v1_invoices_view_path(invoice.external_view_key)

          expect(json_response.dig("invoice", "payment_on_hold")).to be(false)
          expect(json_response["upi_payment"]).to be_blank
          expect(json_response.dig("bank_payment", "enabled")).to be(false)
        end

        %w[cancelled expired].each do |status|
          it "permits another payment method after a confirmed #{status} link with no capture review" do
            invoice.update!(payment_infos: {
              "razorpay_payment_link_id" => "plink_closed", "razorpay_payment_link_account_id" => "acc_original", "razorpay_payment_link_status" => status
            })
            send_request :get, api_v1_invoices_view_path(invoice.external_view_key)
            expect(json_response.dig("invoice", "payment_on_hold")).to be(false)
            expect(json_response.dig("bank_payment", "enabled")).to be(true)
            send_request :get, new_invoice_payment_path(invoice.external_view_key, provider: "upi")
            expect(response.location).to start_with("upi://pay?")
          end
        end

        [{ status: "waived" }, { amount_due: 0 }].each do |attributes|
          it "does not create a checkout session for #{attributes}" do
            invoice.update!(attributes)
            calls = []
            allow_any_instance_of(Invoice).to receive(:create_checkout_session!) do
              calls << :stripe
              Struct.new(:url).new("https://checkout.stripe.com/c/pay/synthetic")
            end
            send_request :get, new_invoice_payment_path(invoice.external_view_key)

            expect(calls).to be_empty
            expect(response).to redirect_to(cancel_invoice_payments_url(invoice.external_view_key, reason: "start"))
          end
        end

        [{ amount_due: 0 }, { amount_due: 500 }, { currency: "USD" }].each do |attributes|
          it "does not expose a stale checkout URL after payment terms change during provider I/O: #{attributes}" do
            allow_any_instance_of(Invoice).to receive(:create_checkout_session!) do
              Invoice.find(invoice.id).update!(attributes)
              Struct.new(:url).new("https://checkout.stripe.com/c/pay/synthetic")
            end
            send_request :get, new_invoice_payment_path(invoice.external_view_key)

            expect(response).to redirect_to(cancel_invoice_payments_url(invoice.external_view_key, reason: "start"))
          end
        end
      end

      it "is able to view the client invoice successfully" do
        send_request :get, api_v1_invoices_view_path(invoice.external_view_key)
        expect(response).to be_successful
      end

      it "does not expose internal payment metadata" do
        invoice.update!(
          payment_infos: {
            stripe_payment_intent: "pi_internal",
            razorpay_payment_link_id: "plink_internal"
          }
        )

        send_request :get, api_v1_invoices_view_path(invoice.external_view_key)

        expect(response).to be_successful
        expect(json_response["invoice"]).not_to have_key("payment_infos")
        expect(json_response["invoice"].to_json).not_to include("pi_internal", "plink_internal")
      end

      it "keeps company financial details private and exposes bank payment details" do
        company.update!(
          bank_name: "QA Bank",
          bank_account_number: "12345678",
          bank_routing_number: "987654321",
          bank_swift_code: "QABKUS33",
          tax_id: "TAX-123",
          vat_number: "VAT-123",
          gst_number: "GST-123",
          ein: "12-3456789",
          us_taxpayer_id: "US-TIN-1234"
        )

        send_request :get, api_v1_invoices_view_path(invoice.external_view_key)

        expect(response).to be_successful
        expect(json_response.dig("company", "bank_name")).to be_nil
        expect(json_response.dig("company", "bank_account_number")).to be_nil
        expect(json_response.dig("company", "bank_routing_number")).to be_nil
        expect(json_response.dig("company", "bank_swift_code")).to be_nil
        expect(json_response.dig("company", "tax_id")).to be_nil
        expect(json_response.dig("company", "vat_number")).to be_nil
        expect(json_response.dig("company", "gst_number")).to be_nil
        expect(json_response.dig("company", "ein")).to be_nil
        expect(json_response.dig("company", "us_taxpayer_id")).to be_nil
        expect(json_response.dig("bank_payment", "enabled")).to be(true)
        expect(json_response.dig("bank_payment", "title")).to eq("US bank details")
        expect(json_response.dig("bank_payment", "bank_name")).to eq("QA Bank")
        expect(json_response.dig("bank_payment", "bank_account_number")).to eq("12345678")
        expect(json_response.dig("bank_payment", "bank_routing_number")).to eq("987654321")
        expect(json_response.dig("bank_payment", "bank_swift_code")).to eq("QABKUS33")
        expect(json_response.dig("razorpay_payment", "enabled")).to be(false)
      end

      it "does not report Stripe as connected when Stripe account retrieval fails" do
        create(:stripe_connected_account, company:, account_id: "acct_local_stale")
        allow(Stripe::Account).to receive(:retrieve)
          .and_raise(Stripe::AuthenticationError.new("No API key provided"))

        send_request :get, api_v1_invoices_view_path(invoice.external_view_key)

        expect(response).to be_successful
        expect(json_response["stripe_connected_account"]).to be(false)
      end

      it "exposes PayPal as a payment option when enabled for a supported currency" do
        create(
          :payments_provider,
          company:,
          name: PaymentsProvider::PAYPAL_PROVIDER,
          enabled: true,
          connected: true,
          settings: { client_id: "client-id", environment: "sandbox", enabled_on_invoices: true, webhook_id: "WH-1" }
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
          settings: { client_id: "client-id", environment: "sandbox", enabled_on_invoices: true, webhook_id: "WH-1" }
        ).tap { |record| record.client_secret = "secret"; record.save! }
        invoice.update!(currency: "INR")

        send_request :get, api_v1_invoices_view_path(invoice.external_view_key)

        expect(json_response.dig("paypal_payment", "enabled")).to be(false)
      end
    end

    context "when the client viewed the invoice" do
      context "if the invoice status is 'sent'" do
        it "updates the invoice status to viewed" do
          send_request :get, api_v1_invoices_view_path(invoice.external_view_key)
          expect(response).to be_successful
          expect(invoice.reload.status).to eq "viewed"
        end
      end

      context "if the invoice status is not 'sent'" do
        it "does not update the invoice status to viewed and it should remain the same status" do
          invoice.update(status: "draft")
          send_request :get, api_v1_invoices_view_path(invoice.external_view_key)
          expect(response).to be_successful
          expect(invoice.reload.status).to eq "draft"
        end
      end
    end
  end
end
