# frozen_string_literal: true

json.client do
  json.extract! client, :id, :name, :email, :phone, :logo
  json.address do
    json.extract! address, :address_line_1, :address_line_2, :city, :state, :country, :pin
  end
end
