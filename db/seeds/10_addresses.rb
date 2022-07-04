# frozen_string_literal: true

# Address Start
address =
  {
    address_type: "current",
    address_line_1: "Saeloun India Pvt. Ltd",
    address_line_2: "403, Sky Vista, Viman Nagar",
    city: "Pune",
    state: "Maharashtra",
    country: "India",
    pin: "411014"
  }

# Create Address for Companies
@companies.each { | company | company.addresses.create!(address) }

# Create Address for Users
@users.each { | user | user.addresses.create!(address) }

puts "Address Created"
# Address End
