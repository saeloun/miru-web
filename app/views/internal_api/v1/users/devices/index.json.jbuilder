# frozen_string_literal: true

json.devices devices do |device|
  json.device_type device.device_type
  json.name device.name
  json.serial_number device.serial_number
  json.specifications device.specifications
end
