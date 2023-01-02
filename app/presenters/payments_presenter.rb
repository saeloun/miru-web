# frozen_string_literal: true

class PaymentsPresenter
  attr_reader :payments

  def initialize(payments)
    @payments = payments
  end

  def index_data
    {
      payments:
              payments.map do | payment |
                {
                  id: payment.id,
                  client_name: payment.invoice.client.name,
                  invoice_number: payment.invoice.invoice_number,
                  transaction_date: payment.transaction_date,
                  note: payment.note,
                  transaction_type: payment.transaction_type,
                  amount: payment.amount,
                  status: payment.status
                }
              end
    }
  end
end
