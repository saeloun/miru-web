# frozen_string_literal: true

# Company Create Start
companies = [
  { name: "Saeloun India Pvt. Ltd",
    address: "somewhere in India",
    business_phone: "+91 0000000000",
    base_currency: "INR",
    standard_price: 100000,
    fiscal_year_end: "apr-mar",
    date_format: "DD-MM-YYYY",
    country: "IN",
    timezone: "Asia - Kolkata" },

  { name: "Saeloun USA INC.",
    address: "somewhere in USA",
    business_phone: "+1 111111111",
    base_currency: "USD",
    standard_price: 1000,
    fiscal_year_end: "jan-dec",
    date_format: "YYYY-MM-DD",
    country: "US",
    timezone: "America - New York" }
]

@companies = companies.map { |company| Company.create!(company) }
puts "Company Created"
@saeloun_india, @saeloun_us = ["Saeloun India Pvt. Ltd", "Saeloun USA INC."].map { |company| Company.find_by(name: company) }
# Company Create End
