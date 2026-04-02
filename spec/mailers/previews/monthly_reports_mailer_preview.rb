# frozen_string_literal: true

require_relative "preview_support"

class MonthlyReportsMailerPreview < ActionMailer::Preview
  include PreviewSupport

  def cash_flow_digest
    client = sample_company.clients.kept.find_by(name: "Haul Hub Inc") ||
      sample_company.clients.kept.find_by(email: "billing@haulhub.example")

    unless client
      client = sample_company.clients.create!(
        name: "Haul Hub Inc",
        email: "billing@haulhub.example",
        phone: "+14155550131",
        currency: sample_company.base_currency
      )
    end
    invoice = sample_company.invoices.find_or_create_by!(invoice_number: "PREVIEW-DIGEST-001") do |record|
      record.client = client
      record.issue_date = Date.new(2026, 3, 24)
      record.due_date = Date.new(2026, 4, 7)
      record.reference = "DIGEST"
      record.amount = 50_644.17
      record.amount_due = 0
      record.outstanding_amount = 0
      record.status = :paid
      record.sent_at = preview_timestamp
      record.base_currency_amount = 50_644.17
      record.currency = sample_company.base_currency
    end

    invoice.update!(
      client:,
      status: :paid,
      amount: 50_644.17,
      amount_due: 0,
      outstanding_amount: 0,
      base_currency_amount: 50_644.17
    )

    Payment.find_or_create_by!(invoice:, transaction_date: Date.new(2026, 3, 12), amount: 50_644.17) do |payment|
      payment.base_currency_amount = 50_644.17
      payment.transaction_type = :bank_transfer
      payment.status = :paid
    end

    Expense.find_or_create_by!(company: sample_company, user: sample_user, date: Date.new(2026, 3, 15), amount: 8_250.50) do |expense|
      expense.category_name = "Payroll"
      expense.vendor_name = "Saeloun Payroll"
      expense.status = :paid
      expense.paid_at = preview_timestamp.change(day: 15)
      expense.expense_type = :business
      expense.description = "Team payroll for the second half of the month"
    end

    MonthlyReportsMailer.with(
      company_id: sample_company.id,
      recipient_id: sample_user.id,
      month: "2026-03-01"
    ).cash_flow_digest
  end
end
