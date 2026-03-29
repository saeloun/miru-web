# frozen_string_literal: true

class InvoiceAmountsSummary
  FULL_AMOUNT_SQL = "COALESCE(NULLIF(base_currency_amount, 0), amount, 0)"
  UNPAID_STATUSES = %w[sent viewed overdue]

  def self.process(invoices)
    new(invoices).process
  end

  def initialize(invoices)
    @invoices = invoices
  end

  def process
    {
      draft_amount: amount_for_statuses("draft"),
      overdue_amount: amount_for_statuses("overdue"),
      outstanding_amount: amount_for_statuses(UNPAID_STATUSES)
    }
  end

  private

    attr_reader :invoices

    def amount_for_statuses(statuses)
      invoices.where(status: statuses).sum(Arel.sql(FULL_AMOUNT_SQL)).to_f.round(2)
    end
end
