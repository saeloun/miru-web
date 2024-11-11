# frozen_string_literal: true

class InternalApi::V1::PaymentsController < ApplicationController
  before_action :set_invoice, only: [:create]
  after_action :track_event, only: [:create]

  def new
    authorize :new, policy_class: PaymentPolicy

    render :new, locals: {
      invoices: current_company.invoices.includes(:client)
        .with_statuses(["sent", "viewed", "overdue"])
        .order(created_at: :asc),
      company: current_company
    }
  end

  def create
    authorize :create, policy_class: PaymentPolicy
    name_attr = { name: current_user.full_name }

    payment = InvoicePayment::Settle.process(payment_params.merge(name_attr), @invoice)
    if @invoice.paid?
      @invoice.send_to_client_email(
        invoice_id: @invoice.id,
        subject: "Payment Confirmation of Invoice #{@invoice.invoice_number} for #{@invoice.company.name}",
        current_user_id: current_user.id
      )
    end

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
        current_company.payments.includes(invoice: [:client]).order(created_at: :desc),
        current_company
        ).index_data
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

    def track_event
      create_payment = "create_payment"
      Invoices::EventTrackerService.new(create_payment, @invoice || invoice, params).process
    end
end
