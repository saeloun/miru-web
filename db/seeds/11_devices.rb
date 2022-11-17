# frozen_string_literal: true

# Devices Start

# Create Devices for Users
@users.each { | user | user.devices.create!(
  device_type: "laptop",
  name: "MacBook Pro",
  serial_number: "1111",
  company_id: 1
  )
}

puts "Device Created"
# Device End
