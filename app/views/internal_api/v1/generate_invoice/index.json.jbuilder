# frozen_string_literal: true

json.company_details do
  json.id current_company.id
  json.logo current_company.logo.attached? ? polymorphic_url(current_company.logo) : ""
  json.name current_company.name
  json.phone_number current_company.business_phone
  json.address current_company.address
  json.country current_company.country
end
json.issue_date Date.current
json.due_date Date.current + 30
json.company_client_list current_company.client_list
