# frozen_string_literal: true

json.key_format! camelize: :lower
json.deep_format_keys!

json.providers do
  json.stripe do
    json.connected stripe_connected_account.nil? ? false : stripe_connected_account.details_submitted
  end
  json.upi do
    json.connected upi_provider&.upi_configured? || false
    json.enabled upi_provider&.enabled? || false
    json.enabled_on_invoices upi_provider&.enabled_on_invoices? || false
    json.upi_id upi_provider&.upi_id
    json.payee_name upi_provider&.payee_name
    json.merchant_category_code upi_provider&.merchant_category_code
    if upi_provider&.upi_configured?
      upi_details = PaymentProviders::UpiIntentService.new(provider: upi_provider).details
      json.payment_link upi_details[:payment_link]
      json.qr_code_svg upi_details[:qr_code_svg]
      json.qr_code_data_uri upi_details[:qr_code_data_uri]
    else
      json.payment_link nil
      json.qr_code_svg nil
      json.qr_code_data_uri nil
    end
  end
end
