# frozen_string_literal: true

json.url new_invoice_payment_url(invoice)
json.invoice invoice
json.logo invoice.company.company_logo
json.lineItems invoice.invoice_line_items
json.stripe_connected_account stripe_connected_account&.details_submitted || false
upi_provider = invoice.company.payments_providers.find_by(name: PaymentsProvider::UPI_PROVIDER, enabled: true)
razorpay_provider = invoice.company.payments_providers.find_by(name: PaymentsProvider::RAZORPAY_PROVIDER, enabled: true)
upi_payment =
  if upi_provider&.enabled_on_invoices? && invoice.currency == "INR"
    PaymentProviders::UpiIntentService.new(provider: upi_provider, invoice:).details
  end
bank_payment_enabled =
  invoice.company.bank_name.present? ||
  invoice.company.bank_account_number.present? ||
  invoice.company.bank_routing_number.present? ||
  invoice.company.bank_swift_code.present?
bank_payment_title =
  if invoice.currency == "INR"
    "India bank details"
  elsif invoice.currency == "USD"
    "US bank details"
  else
    "Bank details"
  end
json.upi_payment upi_payment
json.razorpay_payment do
  json.enabled !!(
    razorpay_provider&.enabled_on_invoices? &&
    razorpay_provider&.razorpay_configured? &&
    invoice.currency == "INR"
  )
  json.provider "razorpay"
end
json.bank_payment do
  json.enabled bank_payment_enabled
  json.title bank_payment_title
  json.bank_name invoice.company.bank_name
  json.bank_account_number invoice.company.bank_account_number
  json.bank_routing_number invoice.company.bank_routing_number
  json.bank_swift_code invoice.company.bank_swift_code
end
json.company do
  json.partial! "internal_api/v1/partial/company", locals: {
    company: invoice.company,
    include_financial_details: false
  }
end
json.client do
  json.partial! "internal_api/v1/partial/client", locals: { client: invoice.client }
end
