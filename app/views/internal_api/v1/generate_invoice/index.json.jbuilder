# frozen_string_literal: true

json.company_details do
  json.id current_company.id
  json.logo Rails.application.routes.url_helpers.rails_blob_path(current_company.logo, only_path: true)
  json.phone_number current_company.business_phone
  json.address current_company.address
  json.country current_company.country
end
json.issue_date Date.current
json.due_date Date.current + 30
json.company_client_list current_company.client_list
