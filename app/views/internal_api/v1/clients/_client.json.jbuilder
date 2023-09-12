# frozen_string_literal: true

json.client do
  json.extract! client, :id, :name, :email, :phone

  json.logo client.logo.attached? ? client.logo_url : nil

  json.address do
    json.partial! "internal_api/v1/partial/address", locals: { address: }
  end
end
