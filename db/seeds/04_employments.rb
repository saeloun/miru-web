# frozen_string_literal: true

# Employment Start
@companies.each { |company| @users.each { | user | company.employments.create!(user:) } }
puts "Employments Created"
# Employment End
