# frozen_string_literal: true

json.key_format! camelize: :lower
json.deep_format_keys!

json.id invoice.id
json.invoice_number invoice.invoice_number
json.issue_date invoice.issue_date
json.due_date invoice.due_date
json.reference invoice.reference
json.amount invoice.amount
json.outstanding_amount invoice.outstanding_amount
json.amount_paid invoice.amount_paid
json.amount_due invoice.amount_due
json.discount invoice.discount
json.tax invoice.tax
json.status invoice.status
json.client do
  json.name client.name
end
