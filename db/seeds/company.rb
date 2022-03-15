# frozen_string_literal: true

# Company Create Start
company = [
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

company.each do |company|
  Company.create!(name: company[:name],
                  address: company[:address],
                  business_phone: company[:business_phone],
                  base_currency: company[:base_currency],
                  standard_price: company[:standard_price],
                  fiscal_year_end: company[:fiscal_year_end],
                  date_format: company[:date_format],
                  country: company[:country],
                  timezone: company[:timezone]
                  )
end
puts "Company Created"
# Company Create End
