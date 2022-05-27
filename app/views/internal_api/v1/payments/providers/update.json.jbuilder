# frozen_string_literal: true

json.key_format! camelize: :lower
json.deep_format_keys!

json.id payments_provider.id
json.name payments_provider.name
json.connected payments_provider.connected
json.enabled payments_provider.enabled
json.accepted_payment_methods payments_provider.accepted_payment_methods
