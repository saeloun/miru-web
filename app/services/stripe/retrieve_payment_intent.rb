# frozen_string_literal: true

class Stripe::RetrievePaymentIntent < ApplicationService
  attr_reader :payment_intent, :account_id

  def initialize(payment_intent, account_id)
    @payment_intent = payment_intent
    @account_id = account_id
  end

  def process
    retrieve_payment_intent
  rescue StandardError => error
    Rails.logger.error error.message
    Rails.logger.error error.backtrace.join("\n")
    nil
  end

  private

    def retrieve_payment_intent
      return nil if payment_intent.nil? && account_id.nil?

      Stripe::PaymentIntent.retrieve(
        payment_intent,
        { stripe_account: account_id }
      )
    end
end
