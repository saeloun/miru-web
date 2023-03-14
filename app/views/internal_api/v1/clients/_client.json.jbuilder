# frozen_string_literal: true

json.client do
  json.extract! client, :id, :name, :email, :phone, :logo
  json.address do
    json.partial! "internal_api/v1/partial/address", locals: { address: }
  end
end
