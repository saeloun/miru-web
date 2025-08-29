# frozen_string_literal: true

if address.present?
  json.id address.id
  json.address_line_1 address.address_line_1
  json.address_line_2 address.address_line_2
  json.city address.city
  json.state address.state
  json.country address.country
  json.pin address.pin
else
  json.id nil
  json.address_line_1 nil
  json.address_line_2 nil
  json.city nil
  json.state nil
  json.country nil
  json.pin nil
end
