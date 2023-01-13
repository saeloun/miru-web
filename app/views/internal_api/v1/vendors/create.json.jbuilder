# frozen_string_literal: true

json.key_format! camelize: :lower
json.deep_format_keys!

json.vendor do
  json.id vendor.id
  json.name vendor.name
end
