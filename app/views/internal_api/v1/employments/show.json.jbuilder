# frozen_string_literal: true

json.employment do
  json.id @employment.id
  json.joined_at @employment.formatted_joined_at
  json.resigned_at @employment.formatted_resigned_at
  json.company_id @employment.company_id
  json.employee_id @employment.employee_id
  json.designation @employment.designation
  json.employment_type @employment.employment_type
  json.user_id @employment.user_id
  json.email @employment.user.email
end
json.date_format current_company.date_format
