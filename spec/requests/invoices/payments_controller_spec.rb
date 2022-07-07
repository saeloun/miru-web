# frozen_string_literal: true

require "rails_helper"

RSpec.describe Invoices::PaymentsController, type: :request do
  let(:company) { create(:company, base_currency: "inr") }
  let(:admin) { create(:user, current_workspace_id: company.id) }
  let(:employee) { create(:user, current_workspace_id: company.id) }
  let(:client) { create(:client_with_phone_number_without_country_code, company:) }
  let!(:invoice) { create(:invoice, status: "sent", client:) }
  let(:params) { { invoice_id: invoice.id } }

  before do
    create(:employment, company:, user: admin)
    create(:employment, company:, user: employee)
  end

  describe "GET new" do
    subject { send_request :get, new_invoice_payment_path(params) }

    let(:success_path) { success_invoice_payments_path(params) }
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

      it "refirects user to success path" do
        subject

        expect(response.status).to eq 302
        expect(response).to redirect_to(success_path)
      end
    end
  end

  describe "GET success" do
    before do
      StripeConnectedAccount.create!({ company: })
      invoice.create_checkout_session!(
        success_url: success_invoice_payments_url(invoice),
        cancel_url: cancel_invoice_payments_url(invoice)
      )
    end

    subject { send_request :get, success_invoice_payments_path(params) }

    it "marks invoice status as paid" do
      expect(invoice.status).not_to eq "paid"
      subject
      expect(response.status).to eq 302
      invoice.reload
      expect(invoice.status).to eq "paid"
    end
  end

  describe "GET cancel" do
    subject { send_request :get, cancel_invoice_payments_path(params) }

    it "renders time tracking page with status 200" do
      subject

      expect(response.status).to eq 200
      expect(response.body).to include("Time tracking and invoicing")
    end
  end
end
