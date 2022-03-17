# frozen_string_literal: true

# Company User Start
require_relative "constant"

companies = [SAELOUN_INDIA, SAELOUN_US]
users = [VIPUL, SUPRIYA, AKHIL, KESHAV, ROHIT]
companies.each { |company| users.each { | user | company.company_users.create!(user_id: user.id) } }
puts "Company User Created"
# Company User End
