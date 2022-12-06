# frozen_string_literal: true

class InternalApi::V1::PaymentsController < ApplicationController
  before_action :set_invoice, only: [:create]

  def new
    authorize :new, policy_class: PaymentPolicy

    render :new, locals: {
      invoices: current_company.invoices.includes(:client)
        .with_statuses(["sent", "viewed", "overdue"])
        .order(created_at: :asc)
    }
  end

  def create
    authorize :create, policy_class: PaymentPolicy
    payment = InvoicePayment::Settle.process(payment_params, @invoice)
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

    def set_invoice
      @invoice = current_company.invoices.find(payment_params[:invoice_id])
    end
end
