# frozen_string_literal: true

class InvoicePayment::StripeCheckoutFulfillment < ApplicationService
  attr_reader :event, :data_object
  attr_accessor :invoice

  def initialize(event)
    @event = event
    @data_object = event.data.object
    @invoice = nil
  end

  def process
    @invoice = find_invoice
    return false if invoice.blank?

    return false unless is_valid_event?
    return true if duplicate_payment?

    InvoicePayment::Settle.process(payment_params, invoice)
    rescue StandardError => error
      Rails.logger.error error.message
      Rails.logger.error error.backtrace.join("\n")
      nil
  end

  private

    def is_valid_event?
      return false unless is_checkout_status_complete? && is_payment_status_paid?

      return true if invoice.stripe_payment_intent.blank? || data_object.payment_intent.blank?

      invoice.stripe_payment_intent == data_object.payment_intent
    end

    def is_checkout_status_complete?
      data_object.status == "complete"
    end

    def is_payment_status_paid?
      data_object.payment_status == "paid"
    end

    def payment_params
      {
        invoice_id: invoice.id,
        transaction_date: DateTime.strptime(event.created.to_s, "%s").to_date,
        transaction_type: "stripe",
        amount: Money.from_cents(event.data.object.amount_total, event.data.object.currency).amount,
        note: "Stripe_Payment_Success",
        name: card_name
      }
    end

    def card_name
      stripe_connected_account = @invoice.company.stripe_connected_account

      return nil if stripe_connected_account.nil? ||
        (stripe_connected_account && stripe_connected_account.account_id.nil?)

      account_id = stripe_connected_account.account_id
      payment_intent = Stripe::RetrievePaymentIntent.new(
        data_object.payment_intent,
        account_id
      ).process
      payment_method = Stripe::RetrievePaymentMethod.new(
        payment_intent.payment_method,
        account_id
      ).process

      payment_method&.billing_details&.name
    rescue StandardError => error
      Rails.logger.warn("Stripe cardholder name lookup failed for invoice #{invoice.id}: #{error.message}")
      nil
    end

    def find_invoice
      invoice_id = data_object&.metadata&.invoice_id
      return Invoice.find_by(id: invoice_id) if invoice_id.present?

      return nil if data_object.payment_intent.blank?

      Invoice.where("payment_infos ->> 'stripe_payment_intent' = ?", data_object.payment_intent).first
    end

    def duplicate_payment?
      invoice.paid?
    end
end
