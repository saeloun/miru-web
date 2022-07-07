# frozen_string_literal: true

class InternalApi::V1::Payments::InvoicesController < ApplicationController
  def create
    authorize :create, policy_class: Payments::InvoicePolicy
    render :create, locals: {
      payment: InvoicePayment.create!(create_payment_params.merge(status: "paid"))
    }
  end

  private

    def create_payment_params
      params.require(:payment).permit(
        :invoice_id, :transaction_date, :transaction_type, :amount, :note
      )
    end
end
