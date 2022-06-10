# frozen_string_literal: true

# Company Create Start
companies = [
  {
    name: "Atharva System Pvt. Ltd",
    address: "805/6/7 - Shilp Epitome, Rajpath Rangoli Road, Ahmedabad - 380054, Gujarat",
    business_phone: "+91 0000000000",
    base_currency: "INR",
    standard_price: 100000,
    fiscal_year_end: "apr-mar",
    date_format: "DD-MM-YYYY",
    country: "IN",
    timezone: "Asia - Kolkata"
  },

  {
    name: "Atharva USA INC.",
    address: "1451, Bayberry Park Cir, Canton, Michigan 48188",
    business_phone: "+1 111111111",
    base_currency: "USD",
    standard_price: 1000,
    fiscal_year_end: "jan-dec",
    date_format: "YYYY-MM-DD",
    country: "US",
    timezone: "America - New York"
  }
]

@companies = companies.map { |company| Company.create!(company) }

puts "Company Created"

@c1, @c2 = companies.map { |company|
  Company.find_by(name: company[:name])
}

{ c1: @c1, c2: @c2 }.each do |key, company|
  company.logo.attach(
    io: File.open(Rails.root.join("app/assets/images/brand/#{key}.png")),
    filename: "brand-#{key}.png")
end
# Company Create End
