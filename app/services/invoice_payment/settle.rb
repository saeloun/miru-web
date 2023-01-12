# frozen_string_literal: true

module InvoicePayment
  class InvoicePayment::Settle < ApplicationService
    attr_reader :payment_params
    attr_accessor :payment, :invoice

    def initialize(payment_params, invoice)
      @invoice = invoice
      @payment_params = payment_params
    end

    def process
      @payment = Payment.create!(payment_params)
      @invoice.settle!(payment)

      @payment
    end
  end
end
