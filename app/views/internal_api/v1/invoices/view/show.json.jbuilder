# frozen_string_literal: true

json.url new_invoice_payment_url(invoice)
json.invoice invoice
json.logo invoice.company.company_logo
json.lineItems invoice.invoice_line_items
json.stripe_connected_account stripe_connected_account&.details_submitted || false
upi_provider = invoice.company.payments_providers.find_by(name: PaymentsProvider::UPI_PROVIDER, enabled: true)
upi_payment =
  if upi_provider&.enabled_on_invoices? && invoice.currency == "INR"
    PaymentProviders::UpiIntentService.new(provider: upi_provider, invoice:).details
  end
json.upi_payment upi_payment
json.company do
  json.partial! "internal_api/v1/partial/company", locals: { company: invoice.company }
end
json.client do
  json.partial! "internal_api/v1/partial/client", locals: { client: invoice.client }
end
