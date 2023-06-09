# frozen_string_literal: true

require "rails_helper"
require "hash_dot"

RSpec.describe InvoicePayment::StripeCheckoutFulfillment do
  include Rails.application.routes.url_helpers
  let(:company) { create(:company, base_currency: "inr") }
  let(:client) { create(:client_with_phone_number_without_country_code, company:) }
  let!(:invoice) { create(
    :invoice, status: "sent", company:, client:,
    amount: 100, amount_due: 100, amount_paid: 0)
  }
  let!(:stripe_connected_account) { create(:stripe_connected_account, company:) }

  before do
    @account = Stripe::Account.create(
      {
        type: "standard",
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
      })

    stripe_connected_account.update_columns(account_id: @account.id)

    p @checkout = invoice.create_checkout_session!(
      success_url: "https://example.com/invoices/#{invoice.id}/payments/success",
      cancel_url: cancel_invoice_payments_url(invoice, host: "https://example.com")
    )
  end

  context "when correct stripe event is passed" do
    #     let!(:current_time) { DateTime.now }
    #     let!(:event) { {
    #       data: {
    #         object: {
    #           metadata: { invoice_id: invoice.id },
    #           payment_intent:  @checkout.payment_intent,
    #           amount_total: Money.from_amount(invoice.amount, "inr").cents,
    #           status: "complete",
    #           payment_status: "paid",
    #           currency: "inr"
    #         }
    #       },
    #       created: current_time.strftime("%s")
    #     }.to_dot
    # }

    before do
      invoice.reload

      p invoice

      Stripe::PaymentIntent.confirm(
        @invoice.stripe_payment_intent,
        { payment_method: "pm_card_visa" },
      )

      success_checkout = Stripe::Checkout::Session.retrieve(@checkout.id, { stripe_account: @account.id })
      @subject = described_class.new(success_checkout).process
    end

    it "creates the payment entry" do
      expect(Payment.last.invoice.id).to eq(invoice.id)
      expect(Payment.last.status).to eq("paid")
    end

    it "updates the invoice status to paid" do
      invoice.reload
      expect(invoice.amount_due).to eq(0)
      expect(invoice.amount_paid).to eq(100)
      expect(invoice.status).to eq("paid")
    end
  end

  #   context "when intent id of invoice and stripe event doesn't match" do
  #     let!(:intent_id) { Faker::Number.number(digits: 10).to_s }
  #     let!(:current_time) { DateTime.now }
  #     let!(:event) { {
  #       data: {
  #         object: {
  #           metadata: { invoice_id: invoice.id },
  #           payment_intent: "intent_id",
  #           amount_total: Money.from_amount(invoice.amount, "inr").cents,
  #           status: "complete",
  #           payment_status: "paid",
  #           currency: "inr"
  #         }
  #       },
  #       created: current_time.strftime("%s")
  #     }.to_dot
  # }

  #     subject { described_class.new(event).process }

  #     before do
  #       invoice.update!(stripe_payment_intent: intent_id)
  #       subject
  #     end

  #     it "doesn't create the payment entry" do
  #       expect(Payment.last&.invoice&.id).not_to eq(invoice.id)
  #     end
  #   end

  #   context "when stripe event status is not complete" do
  #     let!(:intent_id) { Faker::Number.number(digits: 10).to_s }
  #     let!(:current_time) { DateTime.now }
  #     let!(:event) { {
  #       data: {
  #         object: {
  #           metadata: { invoice_id: invoice.id },
  #           payment_intent: intent_id,
  #           amount_total: invoice.amount,
  #           status: "expired",
  #           payment_status: "paid",
  #           currency: "inr"
  #         }
  #       },
  #       created: current_time.strftime("%s")
  #     }.to_dot
  # }

  #     subject { described_class.new(event).process }

  #     before do
  #       invoice.update!(stripe_payment_intent: intent_id)
  #       subject
  #     end

  #     it "doesn't create the payment entry" do
  #       expect(Payment.last&.invoice&.id).not_to eq(invoice.id)
  #     end
  #   end

  #   context "when stripe event payment_status is not paid" do
  #     let!(:intent_id) { Faker::Number.number(digits: 10).to_s }
  #     let!(:current_time) { DateTime.now }
  #     let!(:event) { {
  #       data: {
  #         object: {
  #           metadata: { invoice_id: invoice.id },
  #           payment_intent: intent_id,
  #           amount_total: invoice.amount,
  #           status: "complete",
  #           payment_status: "unpaid",
  #           currency: "inr"
  #         }
  #       },
  #       created: current_time.strftime("%s")
  #     }.to_dot
  # }

  #     subject { described_class.new(event).process }

  #     before do
  #       invoice.update!(stripe_payment_intent: intent_id)
  #       subject
  #     end

  #     it "doesn't create the payment entry" do
  #       expect(Payment.last&.invoice&.id).not_to eq(invoice.id)
  #     end
  #   end
end
