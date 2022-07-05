# frozen_string_literal: true

# Address Start

# Create Address for Companies
@companies.each { | company | company.addresses.create!(
  address_type: "permanent",
  address_line_1: Faker::Address.full_address,
  address_line_2: Faker::Address.full_address,
  state: Faker::Address.state,
  city: Faker::Address.city,
  country: Faker::Address.country,
  pin: Faker::Address.postcode
  )
}

# Create Address for Users
@users.each { | user | user.addresses.create!(
  address_type: "current",
  address_line_1: Faker::Address.full_address,
  address_line_2: Faker::Address.full_address,
  state: Faker::Address.state,
  city: Faker::Address.city,
  country: Faker::Address.country,
  pin: Faker::Address.postcode
  )
}

puts "Address Created"

# Address End
