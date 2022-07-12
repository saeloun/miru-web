# frozen_string_literal: true

json.array! user.addresses, :address_type, :address_line_1, :address_line_2, :city, :state, :country, :pin
