# frozen_string_literal: true

json.key_format! camelize: :lower
json.deep_format_keys!

json.currency current_company.base_currency
json.clients clients do |client|
  json.id client[:id]
  json.name client[:name]
  json.logo client[:logo]
  json.invoices client[:invoices] do |invoice|
    json.client_name client[:name]
    json.invoice_no invoice.invoice_number
    json.issue_date invoice.formatted_issue_date
    json.due_date invoice.formatted_due_date
    json.amount invoice.amount
    json.status invoice.status
  end
  json.total_outstanding_amount client[:total_outstanding_amount]
  json.total_overdue_amount client[:total_overdue_amount]
end
json.summary do
  json.total_outstanding_amount summary[:total_outstanding_amount]
  json.total_overdue_amount summary[:total_overdue_amount]
  json.total_invoice_amount summary[:total_invoice_amount]
end
