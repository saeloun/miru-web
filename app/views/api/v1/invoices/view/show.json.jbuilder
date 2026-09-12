# frozen_string_literal: true

json.url new_invoice_payment_url(invoice.external_view_key)
json.invoice invoice.slice(
  :id,
  :amount,
  :amount_due,
  :amount_paid,
  :currency,
  :discount,
  :due_date,
  :invoice_number,
  :issue_date,
  :reference,
  :status,
  :stripe_enabled,
  :tax
).merge(
  invoice_taxes: invoice.invoice_taxes.map { |invoice_tax|
    {
      id: invoice_tax.id,
      tax_configuration_id: invoice_tax.tax_configuration_id,
      name: invoice_tax.name,
      calculation_method: invoice_tax.calculation_method,
      value: invoice_tax.value.to_f,
      amount: invoice_tax.amount.to_f
    }
  }
)
json.logo invoice.company.company_logo
json.lineItems invoice.invoice_line_items
json.stripe_connected_account stripe_connected_account&.details_submitted || false
upi_provider = invoice.company.payments_providers.find_by(name: PaymentsProvider::UPI_PROVIDER, enabled: true)
razorpay_provider = invoice.company.payments_providers.find_by(name: PaymentsProvider::RAZORPAY_PROVIDER, enabled: true)
paypal_provider = invoice.company.payments_providers.find_by(name: PaymentsProvider::PAYPAL_PROVIDER, enabled: true)
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
json.paypal_payment do
  json.enabled !!(
    paypal_provider&.enabled_on_invoices? &&
    paypal_provider&.paypal_configured? &&
    paypal_provider&.connected? &&
    PaymentsProvider.paypal_currency_supported?(invoice.currency)
  )
  json.url "#{new_invoice_payment_url(invoice.external_view_key)}?provider=paypal"
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
