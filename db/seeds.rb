# frozen_string_literal: true

# Create company
company = Company.create!(
  name: "Saeloun Inc",
  address: "31R Providence Rd Westford MA, 01886",
  country: "US",
  timezone: "EST"
)

# Create Owner user
company.users.create!(
  first_name: "Vipul",
  last_name: "A M",
  email: "vipul@example.com",
  password: "password",
  password_confirmation: "password",
  confirmed_at: DateTime.now
)

# Create Admin user
company.users.create!(
  first_name: "Supriya",
  last_name: "Agarwal",
  email: "supriya@example.com",
  password: "password",
  password_confirmation: "password",
  confirmed_at: DateTime.now
)

# Create Employee User
company.users.create!(
  first_name: "Akhil",
  last_name: "G Krishnan",
  email: "akhil@example.com",
  password: "password",
  password_confirmation: "password",
  confirmed_at: DateTime.now
)
