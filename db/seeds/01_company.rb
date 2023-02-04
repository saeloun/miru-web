# frozen_string_literal: true

company = Company.create!(
  {
    name: "Saeloun Inc",
    address: "475 Clermont Ave, Brooklyn, NY-12238",
    business_phone: "+1 9296207865",
    base_currency: "USD",
    standard_price: 1000,
    fiscal_year_end: "jan-dec",
    date_format: "MM-DD-YYYY",
    country: "US",
    timezone: "America - New York"
  })

puts "Company Created"

company.logo.attach(io: File.open(Rails.root.join("app/assets/images/saeloun_logo.png")), filename: "saeloun_logo.png")

@saeloun_us = company
