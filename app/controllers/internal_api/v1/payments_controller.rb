# frozen_string_literal: true

class InternalApi::V1::PaymentsController < ApplicationController
  def create
    authorize :create, policy_class: PaymentPolicy
    invoice = Invoice.find(params[:payment][:invoice_id])
    payment = Payment.create!(payment_params.merge(status: payment_status(invoice)))
    InvoicePayment::UpdateInvoice.process(payment, invoice)
    render :create, locals: {
      payment:
    }
  end

  private

    def payment_params
      params.require(:payment).permit(
        :invoice_id, :transaction_date, :transaction_type, :amount, :note
      )
    end

    def payment_status(invoice)
      if invoice.amount_due <= payment_params[:amount].to_f
        "paid"
      else
        "partially_paid"
      end
    end
end
