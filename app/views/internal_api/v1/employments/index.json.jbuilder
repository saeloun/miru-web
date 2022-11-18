# frozen_string_literal: true

json.users users do |user|
  json.id user.id
  json.name user.full_name
  json.department_id user.department_id
end
