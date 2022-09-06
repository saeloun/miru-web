# frozen_string_literal: true

  # :assignee
json.extract! device, :id, :available, :base_os, :brand, :device_type, :manufacturer, :meta_details, :name,
  :serial_number, :specifications, :version,
  :version_id
if device.assignee
  json.assignee do
    json.id device.assignee.id
    json.name device.assignee.full_name
    json.department_name device.assignee.department_name
  end
else
  json.assignee nil
end
