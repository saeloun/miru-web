# frozen_string_literal: true

json.extract! client, :id, :name, :email, :phone, :logo
json.extract! address, :address_line_1, :address_line_2, :city, :state, :country, :pin
