# frozen_string_literal: true

json.company_details do
  json.id current_company.id
  json.logo current_company.logo.attached? ? polymorphic_url(current_company.logo) : ""
  json.name current_company.name
  json.business_phone current_company.business_phone
  json.address do
    json.address_line_1 address.address_line_1
    json.address_line_2 address.address_line_2
    json.city address.city
    json.state address.state
    json.country address.country
    json.pin address.pin
  end
  json.country current_company.country
  json.currency current_company.base_currency
  json.standard_price current_company.standard_price
  json.fiscal_year_end current_company.fiscal_year_end
  json.timezone current_company.timezone
  json.date_format current_company.date_format
  json.logo_url
end
json.issue_date Date.current
json.due_date Date.current + 30
json.company_client_list client_list
