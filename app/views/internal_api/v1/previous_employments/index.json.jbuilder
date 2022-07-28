# frozen_string_literal: true

json.previous_employments previous_employments do |previous_employment|
  json.id previous_employment.company_name
  json.name previous_employment.role
end
