# frozen_string_literal: true

json.previous_employments previous_employments do |previous_employment|
  json.company_name previous_employment.company_name
  json.role previous_employment.role
end
