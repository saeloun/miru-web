# frozen_string_literal: true

module InvoicePayment
  class AddPayment < ApplicationService
    attr_reader :payment_params

    def initialize(payment_params)
      @payment_params = payment_params
    end

    def process
      invoice = Invoice.find(payment_params[:invoice_id])
      payment = Payment.create!(payment_params.merge(status: payment_status(invoice)))
      update_invoice(invoice, payment)
      payment
    end

    private

      def update_invoice(invoice, payment)
        invoice_updates = {
          amount_due: due_amount(invoice.amount_due, payment.amount),
          amount_paid: invoice.amount_paid + payment.amount
        }
          .merge(invoice_status(invoice, payment))
        invoice.update!(invoice_updates)
      end

      def due_amount(invoice_due_amount, payment_amount)
        if payment_amount > invoice_due_amount
          0
        else
          invoice_due_amount - payment_amount
        end
      end

      def invoice_status(invoice, payment)
        if invoice.amount_due <= payment.amount
          { status: "paid" }
        else
          {}
        end
      end

      def payment_status(invoice)
        if invoice.amount_due <= payment_params[:amount].to_f
          "paid"
        else
          "partially_paid"
        end
      end
  end
end
