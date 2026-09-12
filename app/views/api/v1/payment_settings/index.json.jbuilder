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
    json.sms_notifications_available current_company.country == "IN" && current_company.pro_access?
    json.sms_notifications_enabled razorpay_provider&.sms_notifications_enabled? || false
    json.payouts_enabled razorpay_provider&.payouts_enabled? || false
    json.payout_account_number razorpay_provider&.payout_account_number
    json.payout_upi_id razorpay_provider&.payout_upi_id
    json.payout_purpose razorpay_provider&.payout_purpose || "payout"
    json.payout_queue_if_low_balance razorpay_provider&.payout_queue_if_low_balance? || false
  end
  json.paypal do
    json.connected paypal_provider&.connected? || false
    json.enabled paypal_provider&.enabled? || false
    json.enabled_on_invoices paypal_provider&.enabled_on_invoices? || false
    json.client_id paypal_provider&.client_id
    json.client_secret_configured paypal_provider&.client_secret.present? || false
    json.environment paypal_provider&.paypal_environment || "live"
    json.webhook_id paypal_provider&.webhook_id
    json.webhook_error paypal_provider&.webhook_error
    json.webhook_url "#{request.base_url}/webhooks/paypal/events"
    json.supported_currencies PaymentsProvider::PAYPAL_CURRENCIES
  end
  json.quickbooks do
    json.configured QuickBooks::Configuration.configured?
    json.connected quickbooks_connection&.connected? || false
    json.status quickbooks_connection&.status
    json.environment QuickBooks::Configuration.environment
    json.realm_id quickbooks_connection&.realm_id
    json.company_name quickbooks_connection&.company_name
    json.last_successful_sync_at quickbooks_connection&.last_successful_sync_at&.iso8601
    json.reconnect_required quickbooks_connection&.reconnect_required? || false
    json.mapping_settings do
      json.income_account_id quickbooks_connection&.income_account_id
      json.accounts_receivable_account_id quickbooks_connection&.accounts_receivable_account_id
      json.deposit_account_id quickbooks_connection&.deposit_account_id
      json.service_item_id quickbooks_connection&.service_item_id
      json.tax_code_id quickbooks_connection&.tax_code_id
    end
  end
end
