# frozen_string_literal: true

json.client do
  json.id client.id
  json.name client.name
  json.email client.email
  json.phone client.phone
  json.logo client.logo
  json.address do
    json.address_line_1 address&.address_line_1
    json.address_line_2 address&.address_line_2
    json.city address&.city
    json.state address&.state
    json.country address&.country
    json.pin address&.pin
  end
end
