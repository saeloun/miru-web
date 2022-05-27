# frozen_string_literal: true

json.key_format! camelize: :lower
json.deep_format_keys!

json.payments_providers payments_providers do |provider|
  json.id provider.id
  json.name provider.name
  json.connected provider.connected
  json.enabled provider.enabled
  json.accepted_payment_methods provider.accepted_payment_methods
end
