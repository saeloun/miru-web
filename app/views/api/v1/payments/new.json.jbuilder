# frozen_string_literal: true

json.key_format! camelize: :lower
json.deep_format_keys!

json.invoices invoices do |invoice|
  json.id invoice.id
  json.client_name invoice.client_name
  json.invoice_number invoice.invoice_number
  json.invoice_date invoice.issue_date
  json.amount invoice.amount
  json.status invoice.status
end

json.company do
  json.date_format company.date_format
end
