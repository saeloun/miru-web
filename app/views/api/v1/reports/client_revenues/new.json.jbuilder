# frozen_string_literal: true

json.client_details clients do |client|
  json.extract! client, :id, :name
end
