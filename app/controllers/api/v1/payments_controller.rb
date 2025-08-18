# frozen_string_literal: true

class Api::V1::PaymentsController < Api::V1::BaseController
  after_action :verify_authorized, except: [:index, :new]

  def index
    payments = current_company.payments.includes(invoice: :client).order(created_at: :desc)

    render json: {
      payments: payments.map do |payment|
        {
          id: payment.id,
          invoiceId: payment.invoice_id,
          invoiceNumber: payment.invoice&.invoice_number,
          clientId: payment.invoice&.client_id,
          clientName: payment.invoice&.client&.name,
          amount: payment.amount || 0,
          status: payment.status || "paid",
          transactionDate: (payment.transaction_date || payment.created_at).strftime("%b %d, %Y"),
          transactionType: payment.transaction_type || "bank_transfer",
          transactionId: payment.id,
          note: payment.note,
          currency: payment.invoice&.client&.currency || current_company.base_currency,
          exchangeRate: payment.exchange_rate
        }
      end,
      baseCurrency: current_company.base_currency,
      total: payments.count
    }
  end

  def new
    # Return data needed for creating a new payment
    invoices = current_company.invoices.includes(:client)
      .where(status: ["sent", "viewed", "overdue"])
      .order(created_at: :desc)

    render json: {
      invoices: invoices.map do |invoice|
        {
          id: invoice.id,
          invoice_number: invoice.invoice_number,
          client_name: invoice.client&.name,
          amount: invoice.amount,
          outstanding_amount: invoice.outstanding_amount,
          status: invoice.status
        }
      end,
      payment_methods: ["manual", "stripe", "paypal", "bank_transfer", "check", "cash"]
    }
  end

  def create
    authorize Payment

    invoice = current_company.invoices.find(payment_params[:invoice_id])
    payment = InvoicePayment::Settle.process(payment_params, invoice)

    if payment.persisted?
      render json: {
        payment: {
          id: payment.id,
          invoiceNumber: invoice.invoice_number,
          transactionDate: payment.transaction_date,
          note: payment.note,
          transactionType: payment.transaction_type,
          clientName: invoice.client.name,
          amount: payment.amount.to_f.to_s,
          status: payment.status
        },
        baseCurrency: current_company.base_currency,
        message: "Payment recorded successfully"
      }, status: 201
    else
      render json: {
        errors: payment.errors.full_messages
      }, status: :unprocessable_entity
    end
  rescue ActiveRecord::RecordInvalid => e
    render json: {
      errors: [e.message]
    }, status: :unprocessable_entity
  end

  private

    def payment_params
      params.require(:payment).permit(
        :invoice_id, :amount, :transaction_date,
        :transaction_type, :note, :name, :status
      )
    end
end
