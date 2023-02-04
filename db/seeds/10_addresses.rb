# frozen_string_literal: true

# Address Start

# Create Address for Companies
@saeloun_us.addresses.create!(
  address_type: "permanent",
  address_line_1: "Saeloun Inc",
  address_line_2: "475 Clermont Ave",
  state: "NY",
  city: "Brooklyn",
  country: "US",
  pin: "12238"
  )

# Create Address for Users
@users.each { | user | user.addresses.create!(
  address_type: "current",
  address_line_1: "Flat-1",
  address_line_2: "Apartment A1",
  state: "NY",
  city: "Brooklyn",
  country: "US",
  pin: "12238"
  )
}

puts "Address Created"

# Address End
