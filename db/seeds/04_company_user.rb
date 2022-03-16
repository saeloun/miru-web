# frozen_string_literal: true

# Company User Start
require_relative "constant"

companies = [SAELOUN_INDIA, SAELOUN_US]
users = [VIPUL, SUPRIYA, AKHIL, KESHAV, ROHIT]
companies.each do |company|
  users.each do |user|
    company.company_users.create!(user_id: user.id)
  end
end

puts "Company User Created"
# Company User End
