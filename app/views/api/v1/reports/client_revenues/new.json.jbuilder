# frozen_string_literal: true

json.clients clients do |client|
  json.extract! client, :id, :name
end
