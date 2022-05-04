# frozen_string_literal: true

json.id company.id
json.logo company.logo.attached? ? polymorphic_url(company.logo) : ""
json.name company.name
json.phone_number company.business_phone
json.address company.address
json.country company.country
json.currency company.base_currency
