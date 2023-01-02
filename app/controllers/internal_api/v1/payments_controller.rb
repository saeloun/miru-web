# frozen_string_literal: true

class InternalApi::V1::PaymentsController < ApplicationController
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
    payment = InvoicePayment::AddPayment.process(payment_params)
    render :create, locals: {
      payment:,
      invoice: payment.invoice,
      client: payment.invoice.client
    }
  end

  def index
    authorize :index, policy_class: PaymentPolicy
    render :index,
      locals: PaymentsPresenter.new(
        current_company.payments.includes(invoice: [:client]).order(created_at: :desc)
        ).index_data
  end

  private

    def payment_params
      params.require(:payment).permit(
        :invoice_id, :transaction_date, :transaction_type, :amount, :note
      )
    end
end
