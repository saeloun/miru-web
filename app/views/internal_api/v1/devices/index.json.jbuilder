# frozen_string_literal: true

json.key_format! camelize: :lower
json.deep_format_keys!

json.devices devices do |device|
  json.id device[:id]
  json.user_name device.user.present? ? device.user.full_name : nil
  json.device_type device[:device_type]
  json.name device[:name]
  json.serial_number device[:serial_number]
  json.specifications device[:specifications]
  json.created_at device[:created_at]
  json.assignee_name device.assignee.present? ? device.assignee.full_name : nil
  json.available device[:available]
  json.version device[:version]
  json.version_id device[:version_id]
  json.brand device[:brand]
  json.manufacturer device[:manufacturer]
  json.base_os device[:base_os]
end

json.pagy pagy
