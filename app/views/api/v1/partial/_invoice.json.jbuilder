# frozen_string_literal: true

json.id invoice.id
json.issue_date invoice.formatted_issue_date
json.due_date invoice.formatted_due_date
json.invoice_number invoice.invoice_number
json.reference invoice.reference
json.amount invoice.amount
json.tax invoice.tax
json.amount_paid invoice.amount_paid
json.amount_due invoice.amount_due
json.base_currency_amount invoice.base_currency_amount
json.discount invoice.discount
json.status invoice.status
json.stripe_enabled invoice.stripe_enabled
json.currency invoice.currency
