# frozen_string_literal: true

# Address Start

# Create Address for Companies
@companies.each { | company | company.addresses.create!(
  address_type: "permanent",
  address_line_1: "Saeloun India Pvt. Ltd",
  address_line_2: "403 SkyVista, Viman Nagar",
  state: "Maharashtra",
  city: "Pune",
  country: "India",
  pin: "411014"
  )
}

# Create Address for Users
@users.each { | user | user.addresses.create!(
  address_type: "current",
  address_line_1: "Flat-1",
  address_line_2: "Apartment A1",
  state: "Maharashtra",
  city: "Pune",
  country: "India",
  pin: "123456"
  )
}

puts "Address Created"

# Address End
