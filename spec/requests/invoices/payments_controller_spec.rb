# frozen_string_literal: true

require "rails_helper"

RSpec.describe Invoices::PaymentsController, type: :request do
  let(:company) { create(:company, base_currency: "inr") }
  let(:admin) { create(:user, current_workspace_id: company.id) }
  let(:employee) { create(:user, current_workspace_id: company.id) }
  let(:client) { create(:client_with_phone_number_without_country_code, company:) }
  let!(:invoice) { create(:invoice, status: "sent", client:) }
  let!(:stripe_connected_account) { create(:stripe_connected_account, company:) }
  let(:params) { { invoice_id: invoice.id } }

  before do
    create(:employment, company:, user: admin)
    create(:employment, company:, user: employee)
  end

  describe "GET new", :vcr do
    subject { send_request :get, new_invoice_payment_path(params) }

    let(:success_path) { "/invoices/#{invoice.id}/payments/success" }
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
        success_url: "https://example.com/invoices/#{invoice.id}/payments/success",
        cancel_url: cancel_invoice_payments_url(invoice)
      )
    end

    subject { send_request :get, "/invoices/#{invoice.id}/payments/success" }

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
end
