# frozen_string_literal: true

json.key_format! camelize: :lower
json.deep_format_keys!

json.id invoice.id
json.invoice_number invoice.invoice_number
json.issue_date invoice.issue_date
json.due_date invoice.due_date
json.reference invoice.reference
json.amount invoice.amount
json.currency(invoice.draft? && client.currency.present? ? client.currency : invoice.currency)
json.outstanding_amount invoice.outstanding_amount
json.amount_paid invoice.amount_paid
json.amount_due invoice.amount_due
json.base_currency_amount invoice.base_currency_amount
json.discount invoice.discount
json.tax invoice.tax
json.invoice_taxes invoice.invoice_taxes do |invoice_tax|
  json.partial! "internal_api/v1/partial/invoice_tax", locals: { invoice_tax: }
end
json.status invoice.status
json.stripe_enabled invoice.stripe_enabled
json.invoice_line_items invoice.invoice_line_items do |invoice_line_item|
  json.id invoice_line_item.id
  json.name invoice_line_item.name
  json.description invoice_line_item.description
  json.date invoice_line_item.date
  json.rate invoice_line_item.rate
  json.quantity invoice_line_item.quantity
  json.timesheet_entry_id invoice_line_item.timesheet_entry_id
  json.linked_timesheet_entry_ids invoice_line_item.linked_timesheet_entry_ids
end
json.client do
  json.partial! "internal_api/v1/partial/client", locals: { client: }
end
json.company do
  json.partial! "internal_api/v1/partial/company", locals: {
    company: invoice.company,
    include_financial_details: local_assigns.fetch(:include_financial_details, true)
  }
end
