# frozen_string_literal: true

# Company User Start
@companies.each { |company| @users.each { | user | company.company_users.create!(user_id: user.id) } }
puts "Company User Created"
# Company User End
