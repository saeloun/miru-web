# frozen_string_literal: true

class InternalApi::V1::PaymentsController < ApplicationController
  def create
    authorize :create, policy_class: PaymentsPolicy
    invoice = Invoice.find(params[:payment][:invoice_id])
    payment = Payment.create!(create_payment_params.merge(status: payment_status(invoice)))
    update_invoice(invoice)
    render :create, locals: {
      payment:
    }
  end

  private

    def create_payment_params
      params.require(:payment).permit(
        :invoice_id, :transaction_date, :transaction_type, :amount, :note
      )
    end

    def payment_status(invoice)
      if invoice.amount_due <= params[:payment][:amount].to_f
        "paid"
      else
        "partially_paid"
      end
    end

    def update_invoice(invoice)
      updates = {
        amount_due: invoice.amount_due - params[:payment][:amount].to_f,
        amount_paid: invoice.amount_paid + params[:payment][:amount].to_f
      }
        .merge(invoice_status(invoice))
      invoice.update!(updates)
    end

    def invoice_status(invoice)
      if payment_status(invoice) == "paid"
        { status: "paid" }
      else
        {}
      end
    end
end
