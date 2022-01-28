# frozen_string_literal: true

json.array!(clients) do |client|
  json.merge! client.attributes.slice(
    "id",
    "company_id",
    "name",
    "email",
    "phone",
    "address",
    "country",
    "timezone",
    "created_at"
  )
end
