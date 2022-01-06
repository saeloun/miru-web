# frozen_string_literal: true

# This file should contain all the record creation needed to seed the database with its default values.
# The data can then be loaded with the bin/rails db:seed command (or created alongside the database with db:setup).
#
# Examples:
#
#   movies = Movie.create([{ name: "Star Wars" }, { name: "Lord of the Rings" }])
#   Character.create(name: "Luke", movie: movies.first)

company = Company.create!(
  name: "Saeloun",
  address: Faker::Address.full_address,
  business_phone: Faker::PhoneNumber.cell_phone_in_e164,
  base_currency: Faker::Currency.code,
  standard_price: Faker::Number.decimal(l_digits: 3, r_digits: 2),
  fiscal_year_end: Date::MONTHNAMES.sample,
  date_format: "DD-MM-YYYY",
  country: "USA",
  timezone: "EST"
)

user = company.users.create!(
  first_name: Faker::Name.first_name,
  last_name: Faker::Name.first_name,
  email: Faker::Internet.safe_email,
  password: Faker::Internet.password,
  role: User.roles.values.sample
)
