# frozen_string_literal: true

json.label client[:name]
json.value client[:id]
json.address client[:address]
json.phone client[:phone]
json.email client[:email]
json.client_logo client.client_logo.attached? ? polymorphic_url(client.client_logo) : ""
