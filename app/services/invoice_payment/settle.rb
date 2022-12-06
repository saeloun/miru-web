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
      # create payment
      @payment = Payment.create!(payment_params)

      # update invoice
      @invoice.settle!(payment)

      @payment
    end
  end
end
