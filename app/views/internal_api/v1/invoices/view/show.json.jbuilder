# frozen_string_literal: true

json.url new_invoice_payment_url(invoice)
json.invoice invoice
json.logo invoice.company.company_logo
json.lineItems invoice.invoice_line_items
json.stripe_connected_account stripe_connected_account.present? ? true : false
json.company do
  json.partial! "internal_api/v1/partial/company", locals: { company: invoice.company }
end
json.client do
  json.partial! "internal_api/v1/partial/client", locals: { client: invoice.client }
end
json.bank_account do
  json.partial! "internal_api/v1/invoices/bank_account", bank_account:
end
