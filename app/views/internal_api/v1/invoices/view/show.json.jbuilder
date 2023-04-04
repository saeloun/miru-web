# frozen_string_literal: true

json.url new_invoice_payment_url(invoice)
json.invoice invoice
json.logo invoice.company.company_logo
json.lineItems invoice.invoice_line_items
json.company invoice.company
json.client invoice.client
