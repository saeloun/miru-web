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
              payments.map do | payment |
                {
                  id: payment.id,
                  client_name: payment.invoice.client.name,
                  invoice_number: payment.invoice.invoice_number,
                  transaction_date: DateFormatter.new(
                    payment.transaction_date,
                    company: current_company).company_format,
                  note: payment.note,
                  transaction_type: payment.transaction_type,
                  amount: payment.amount,
                  status: payment.status
                }
              end
    }
  end
end
