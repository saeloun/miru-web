# frozen_string_literal: true

# Create company
puts "Creating company"
company = Company.create!(
  name: "Saeloun Inc",
  address: "31R Providence Rd Westford MA, 01886",
  country: "US",
  timezone: "EST"
)
puts "Company Created"

users = [
          { first_name: "Vipul", last_name: "A M", email: "vipul@example.com", role: :owner },
          { first_name: "Supriya", last_name: "Agarwal", email: "supriya@example.com", role: :admin },
          { first_name: "Akhil", last_name: "G Krishnan", email: "akhil@example.com", role: :employee }
        ]

puts "Creating users for #{company.name}"
users.each do |user|
  company_user = company.users.create!(
    first_name: user[:first_name],
    last_name: user[:last_name],
    email: user[:email],
    password: "password",
    password_confirmation: "password",
    confirmed_at: Time.current
  )
  company_user.add_role(user[:role])
end
puts "#{users.size} Users created"

client = Client.create!(
  name: "Saeloun",
  email: "contact@saeloun.com"
)
puts "Client Created"

project = Project.create!(
  client: client,
  company: company,

)
