# frozen_string_literal: true

class Api::V1::PaymentsController < Api::V1::ApplicationController
  before_action :set_invoice, only: [:create]
  before_action :set_payment, only: [:show, :withdraw]
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

    payments = current_company.payments.includes(:razorpay_payouts, invoice: [:client])

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

  def withdraw
    authorize @payment, :withdraw?, policy_class: PaymentPolicy

    payout = PaymentProviders::RazorpayWithdrawalService.new(
      payment: @payment,
      requested_by: current_user,
      automatic: false
    ).process

    render json: {
      payout: PaymentsPresenter.serialize_razorpay_payout(payout)
    }, status: 202
  rescue PaymentProviders::RazorpayWithdrawalService::Error => error
    render json: { error: error.message }, status: 422
  end

  def bulk_download
    authorize :bulk_download, policy_class: PaymentPolicy

    payment_ids = params[:ids].to_s.split(",").map(&:to_i)
    payments = current_company.payments.includes(invoice: :client).where(id: payment_ids)

    if payments.empty?
      render json: { error: "No payments found for the given IDs" }, status: 404
      return
    end

    csv_data = generate_bulk_csv(payments)
    send_data csv_data,
      filename: "payments_export_#{Date.current}.csv",
      type: "text/csv",
      disposition: "attachment"
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
      @payment = current_company.payments.includes(:razorpay_payouts, invoice: [:client]).find(params[:id])
    end

    def track_event
      create_payment = "create_payment"
      Invoices::EventTrackerService.new(create_payment, @invoice, params).process
    end

    def generate_bulk_csv(payments)
      require "csv"

      CSV.generate(headers: true) do |csv|
        csv << ["Date", "Client", "Invoice Number", "Payment Method", "Transaction ID", "Amount", "Currency", "Status", "Notes"]
        payments.each do |payment|
          csv << [
            payment.transaction_date,
            payment.invoice&.client&.name || "Unknown Client",
            payment.invoice&.invoice_number,
            payment.transaction_type&.humanize,
            "PAY-#{payment.id}",
            payment.amount,
            payment.payment_currency || payment.company&.base_currency,
            payment.status&.humanize,
            payment.note
          ]
        end
      end
    end
end
