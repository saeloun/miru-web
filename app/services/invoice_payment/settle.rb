# frozen_string_literal: true

module InvoicePayment
  class InvoicePayment::Settle < ApplicationService
    attr_reader :payment_params, :payment, :invoice, :stripe_payment_data

    def initialize(payment_params, invoice, stripe_payment_data = {})
      @invoice = invoice
      @payment_params = payment_params
      @stripe_payment_data = stripe_payment_data
    end

    def process
      @payment = Payment.create!(payment_params)
      @invoice.settle!(payment)
      @payment
    end
  end
end
