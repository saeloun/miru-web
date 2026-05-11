# frozen_string_literal: true

invoice_currency =
  if invoice.draft? && invoice.client&.currency.present?
    invoice.client.currency
  else
    invoice.currency || current_company.base_currency
  end

json.id invoice.id
json.invoice_number invoice.invoice_number
json.client_id invoice.client_id
json.client_name invoice.client&.name
json.status invoice.status
json.issue_date invoice.issue_date
json.due_date invoice.due_date
json.amount invoice.amount.to_f
json.amount_due invoice.amount_due.to_f
json.outstanding_amount invoice.outstanding_amount.to_f
json.base_currency_amount invoice.base_currency_amount.to_f
json.exchange_rate invoice.respond_to?(:exchange_rate) ? invoice.exchange_rate.to_f : 0.0
json.tax invoice.tax.to_f if local_assigns.fetch(:include_tax_and_discount, false)
json.discount invoice.discount.to_f if local_assigns.fetch(:include_tax_and_discount, false)
json.currency invoice_currency
json.created_at invoice.created_at if local_assigns.fetch(:include_created_at, false)
json.updated_at invoice.updated_at

json.client do
  json.id invoice.client_id
  json.name invoice.client&.name
  json.email invoice.client&.email if invoice.client&.email
  json.phone invoice.client&.phone if invoice.client&.phone
  json.logo invoice.client&.logo_url if invoice.client&.logo_url
  json.client_members_emails invoice.client&.send_invoice_emails(virtual_verified_invitations_allowed) || []
end

json.company do
  json.name current_company.name
  json.base_currency current_company.base_currency
  json.currency invoice_currency
  json.date_format current_company.date_format
end

json.razorpay_payment_link_url invoice.razorpay_payment_link_url
json.razorpay_payment_link_status invoice.razorpay_payment_link_status
