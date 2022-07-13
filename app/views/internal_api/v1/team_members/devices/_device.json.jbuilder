# frozen_string_literal: true

json.array! user.devices, :device_type, :name, :serial_number, :specifications
