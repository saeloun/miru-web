# frozen_string_literal: true

json.client do
  json.extract! client, :id, :name, :email, :phone
  json.extract! client, :legal_name, :finance_email, :signatory_name, :signatory_designation, :signatory_email

  json.logo client.logo.attached? ? client.logo_url : nil

  json.address do
    json.partial! "internal_api/v1/partial/address", locals: { address: }
  end
end
