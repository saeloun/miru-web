json.success true
json.device do
  json.partial! "device_api/devices/device", locals: { device: }
end
json.approved_device_usage do
  json.extract! last_usage_request, :id, :approve, :device_id

  if last_usage_request.assignee
    json.assignee do
      json.id last_usage_request.assignee.id
      json.name last_usage_request.assignee.full_name
      json.department_name last_usage_request.assignee.department_name
    end
  else
    json.assignee nil
  end

  if last_usage_request.created_by
    json.created_by do
      json.id last_usage_request.created_by.id
      json.name last_usage_request.created_by.full_name
      json.department_name last_usage_request.created_by.department_name
    end
  else
    json.created_by nil
  end
end
json.notice I18n.t("device_usage.update.success.message")
