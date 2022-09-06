# frozen_string_literal: true

json.extract! device_usage, :id, :device, :approve

if device_usage.assignee
  json.assignee do
    json.id device_usage.assignee.id
    json.name device_usage.assignee.full_name
    json.department_name device_usage.assignee.department_name
  end
else
  json.assignee nil
end

if device_usage.created_by
  json.created_by do
    json.id device_usage.created_by.id
    json.name device_usage.created_by.full_name
    json.department_name device_usage.created_by.department_name
  end
else
  json.created_by nil
end
