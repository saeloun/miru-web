# frozen_string_literal: true

class Stripe::RetrievePaymentMethod < ApplicationService
  attr_reader :payment_method, :account_id

  def initialize(payment_method, account_id)
    @payment_method = payment_method
    @account_id = account_id
  end

  def process
    retrieve_payment_method
  rescue StandardError => error
    Rails.logger.error error.message
    Rails.logger.error error.backtrace.join("\n")
    nil
  end

  private

    def retrieve_payment_method
      return nil if payment_method.nil? && account_id.nil?

      Stripe::PaymentMethod.retrieve(
        payment_method,
        { stripe_account: account_id }
      )
    end
end
