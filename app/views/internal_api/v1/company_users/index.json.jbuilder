# frozen_string_literal: true

json.users users do |user|
  json.id user[:id]
  json.name user[:name]
end
