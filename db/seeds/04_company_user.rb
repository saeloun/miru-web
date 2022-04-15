# frozen_string_literal: true

# Company User Start
@companies.each { |company| @users.each { | user | company.company_users.create!(user:) } }
puts "Company User Created"
# Company User End
