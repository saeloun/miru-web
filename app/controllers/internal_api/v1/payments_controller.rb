# frozen_string_literal: true

class InternalApi::V1::PaymentsController < ApplicationController
  def create
    authorize :create, policy_class: PaymentPolicy
    payment = InvoicePayment::AddPayment.process(payment_params)
    render :create, locals: {
      payment:
    }
  end

  def index
    authorize :index, policy_class: PaymentPolicy
    render :index, locals: {
      payments: current_company.payments.order(created_at: :desc)
    }
  end

  private

    def payment_params
      params.require(:payment).permit(
        :invoice_id, :transaction_date, :transaction_type, :amount, :note
      )
    end
end
