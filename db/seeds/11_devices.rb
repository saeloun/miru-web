# frozen_string_literal: true

# Devices Start
device =
  {
    device_type: "laptop",
    name: "MacBook Pro",
    serial_number: "1234567890",
    specifications:
          {
            ram: "32GB",
            graphics: "Intel UHD Graphics 630",
            processor: "Intel Core i7"
          },
    company_id: 1
  }

# Create Devices for Users
@users.each { | user | user.devices.create!(device) }

puts "Device Created"
# Device End
