# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Api::V1::Invoices::Payments#success", type: :request do
  let(:company) { create(:india_company, base_currency: "INR") }
  let(:client) { create(:client, company:, currency: "INR") }
  let(:invoice) do
    create(
      :invoice,
      company:,
      client:,
      currency: "INR",
      invoice_number: "INV-RAZORPAY-1",
      amount: 1000,
      amount_due: 0,
      amount_paid: 1000,
      status: "paid"
    )
  end
  let(:unpaid_invoice) do
    create(
      :invoice,
      company:,
      client:,
      currency: "INR",
      invoice_number: "INV-RAZORPAY-2",
      amount: 1000,
      amount_due: 1000,
      amount_paid: 0,
      status: "sent"
    )
  end

  it "returns a limited invoice payload for verified Razorpay success" do
    send_request :get, api_v1_invoices_success_path(invoice, provider: PaymentsProvider::RAZORPAY_PROVIDER)

    expect(response).to have_http_status(:ok)
    expect(json_response.dig("invoice", "id")).to eq(invoice.id)
    expect(json_response.dig("invoice", "invoice_number")).to eq("INV-RAZORPAY-1")
    expect(json_response.dig("invoice", "status")).to eq("paid")
    expect(json_response.dig("invoice", "payment_infos")).to be_nil
    expect(json_response["notice"]).to eq(I18n.t("invoices.payments.success.success"))
  end

  it "returns a limited invoice payload for verified Stripe success" do
    payment_intent = instance_double(InvoicePayment::StripePaymentIntent, process: true)
    allow(InvoicePayment::StripePaymentIntent).to receive(:new).and_return(payment_intent)

    send_request :get, api_v1_invoices_success_path(unpaid_invoice)

    expect(response).to have_http_status(:ok)
    expect(json_response.dig("invoice", "id")).to eq(unpaid_invoice.id)
    expect(json_response.dig("invoice", "invoice_number")).to eq("INV-RAZORPAY-2")
    expect(json_response.dig("invoice", "status")).to eq("sent")
    expect(json_response.dig("invoice", "payment_infos")).to be_nil
    expect(json_response["notice"]).to eq(I18n.t("invoices.payments.success.success"))
  end

  it "rejects Razorpay success while the invoice is not paid" do
    send_request :get, api_v1_invoices_success_path(unpaid_invoice, provider: PaymentsProvider::RAZORPAY_PROVIDER)

    expect(response).to have_http_status(:unprocessable_content)
    expect(json_response["error"]).to eq(I18n.t("invoices.payments.success.failure"))
  end
end
