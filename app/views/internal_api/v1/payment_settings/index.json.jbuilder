# frozen_string_literal: true

json.key_format! camelize: :lower
json.deep_format_keys!

json.providers do
  json.stripe do
    json.connected stripe_connected_account.nil? ? false : stripe_connected_account.details_submitted
  end
  json.paypal do
    json.connected false
  end
end
