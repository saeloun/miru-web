# frozen_string_literal: true

json.id company.id
json.logo company.logo.attached? ? polymorphic_url(company.logo) : ""
json.name company.name
json.phone_number company.business_phone
json.address company.current_address
json.country company.country
json.currency company.base_currency
json.date_format company.date_format
json.bank_name company.bank_name
json.bank_account_number company.bank_account_number
json.bank_routing_number company.bank_routing_number
json.bank_swift_code company.bank_swift_code
json.tax_id company.tax_id
json.vat_number company.vat_number
json.gst_number company.gst_number
