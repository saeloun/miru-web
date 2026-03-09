# frozen_string_literal: true

class Api::V1::PaymentsController < Api::V1::ApplicationController
  before_action :set_invoice, only: [:create]
  before_action :set_payment, only: [:show]
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
        subject: "Payment Confirmation of Invoice #{@invoice.invoice_number} for #{@invoice.company.name}"
      )
    end

    render :create, locals: {
      payment:,
      invoice: payment.invoice,
      client: payment.invoice.client
    }, status: 201
  end

  def index
    authorize :index, policy_class: PaymentPolicy

    payments = current_company.payments.includes(invoice: [:client])

    # Add search functionality
    if params[:query].present?
      search_query = ActiveRecord::Base.sanitize_sql_like(params[:query].to_s.strip.downcase)
      payments = payments.joins(invoice: :client)
                        .where("LOWER(clients.name) LIKE :query OR
                                LOWER(invoices.invoice_number) LIKE :query OR
                                CAST(payments.amount AS TEXT) LIKE :query",
                               query: "%#{search_query}%")
    end

    payments = payments.order(created_at: :desc)

    render :index,
      locals: PaymentsPresenter.new(payments, current_company).index_data
  end

  def show
    authorize :show, policy_class: PaymentPolicy

    render :show, locals: {
      payment: PaymentsPresenter.new([@payment], current_company).index_data[:payments].first,
      base_currency: current_company.base_currency
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

    def set_payment
      @payment = current_company.payments.includes(invoice: [:client]).find(params[:id])
    end

    def track_event
      create_payment = "create_payment"
      Invoices::EventTrackerService.new(create_payment, @invoice, params).process
    end
end
