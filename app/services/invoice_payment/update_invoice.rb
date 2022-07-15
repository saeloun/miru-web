# frozen_string_literal: true

module InvoicePayment
  class UpdateInvoice < ApplicationService
    def initialize(payment, invoice)
      @payment = payment
      @invoice = invoice
    end

    def process
      invoice_updates = {
        amount_due: @invoice.amount_due - @payment.amount,
        amount_paid: @invoice.amount_paid + @payment.amount
      }
        .merge(invoice_status)
      @invoice.update!(invoice_updates)
    end

    private

      def invoice_status
        if @invoice.amount_due <= @payment.amount
          { status: "paid" }
        else
          {}
        end
      end
  end
end
