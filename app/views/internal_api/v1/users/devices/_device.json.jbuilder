# frozen_string_literal: true

json.extract! device, *device.attributes.keys.map(&:to_sym)
