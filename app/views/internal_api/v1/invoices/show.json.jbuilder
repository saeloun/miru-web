# frozen_string_literal: true

json.key_format! camelize: :lower
json.deep_format_keys!
json.id invoice.id
json.issue_date invoice.issue_date
json.due_date invoice.due_date
json.invoice_number invoice.invoice_number
json.reference invoice.reference
json.amount invoice.amount
json.tax invoice.tax
json.amount_paid invoice.amount_paid
json.amount_due invoice.amount_due
json.discount invoice.discount
json.status invoice.status
json.client do
  json.id invoice.client.id
  json.name invoice.client.name
  json.email invoice.client.email
  json.phone invoice.client.phone
  json.address invoice.client.address
end
json.company do
  json.id invoice.client.company.id
  json.logo invoice.client.company.logo.attached? ? polymorphic_url(invoice.client.company.logo) : ""
  json.name invoice.client.company.name
  json.phone_number invoice.client.company.business_phone
  json.address invoice.client.company.address
  json.country invoice.client.company.country
  json.currency invoice.client.company.base_currency
end
json.invoice_line_items invoice.invoice_line_items do |invoice_line_item|
  json.id invoice_line_item.id
  json.name invoice_line_item.name
  json.description invoice_line_item.description
  json.date invoice_line_item.date
  json.rate invoice_line_item.rate
  json.quantity invoice_line_item.quantity
  json.timesheet_entry_id invoice_line_item.timesheet_entry_id
end
