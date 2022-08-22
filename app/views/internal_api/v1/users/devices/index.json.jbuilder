# frozen_string_literal: true

json.devices devices do |device|
  json.partial! "device", locals: { device: }
end
