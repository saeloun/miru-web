# frozen_string_literal: true

class PaymentsPresenter
  attr_reader :payments, :current_company

  def initialize(payments, current_company)
    @payments = payments
    @current_company = current_company
  end

  def index_data
    {
      payments:
              payments.map do |payment|
                {
                  id: payment.id,
                  clientName: payment.invoice.client.name,
                  invoiceNumber: payment.invoice.invoice_number,
                  invoiceId: payment.invoice.id,
                  transactionDate: CompanyDateFormattingService.new(
                    payment.transaction_date,
                    company: current_company
                  ).process,
                  note: payment.note,
                  transactionType: payment.transaction_type,
                  amount: payment.amount,
                  status: payment.status,
                  currency: payment.payment_currency || payment.invoice.currency || current_company.base_currency,
                  exchangeRate: payment.exchange_rate,
                  baseCurrencyAmount: payment.base_currency_amount
                }
              end,
      total: payments.size,
      baseCurrency: current_company.base_currency
    }
  end
end
