# frozen_string_literal: true

# Company User Start
[@saeloun_India, @saeloun_us].each { |company| [@vipul, @supriya, @akhil, @keshav, @rohit].each { | user | company.company_users.create!(user_id: user.id) } }
puts "Company User Created"
# Company User End
