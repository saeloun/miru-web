# frozen_string_literal: true

json.key_format! camelize: :lower
json.deep_format_keys!

json.providers do
  json.stripe do
    stripe_enabled = stripe_connected_account.nil? ? false : stripe_connected_account.details_submitted
    json.connected stripe_enabled
    json.enabled stripe_enabled
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
  json.razorpay do
    json.connected razorpay_provider&.razorpay_configured? || false
    json.enabled razorpay_provider&.enabled? || false
    json.enabled_on_invoices razorpay_provider&.enabled_on_invoices? || false
    json.key_id razorpay_provider&.key_id
    json.key_secret_configured razorpay_provider&.key_secret.present? || false
    json.webhook_secret_configured razorpay_provider&.webhook_secret.present? || false
    json.linked_account_id razorpay_provider&.linked_account_id
    json.platform_fee_percent razorpay_provider&.platform_fee_percent || "5"
    json.route_transfers_enabled razorpay_provider&.route_transfers_enabled? || false
    json.payouts_enabled razorpay_provider&.payouts_enabled? || false
    json.payout_account_number razorpay_provider&.payout_account_number
    json.payout_upi_id razorpay_provider&.payout_upi_id
    json.payout_purpose razorpay_provider&.payout_purpose || "payout"
    json.payout_queue_if_low_balance razorpay_provider&.payout_queue_if_low_balance? || false
  end
end
