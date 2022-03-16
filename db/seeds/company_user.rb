# frozen_string_literal: true

# Company User Start
companies = ["Saeloun India Pvt. Ltd", "Saeloun USA INC."].map { |company| Company.find_by(name: company) }
users = ["vipul@example.com", "supriya@example.com", "akhil@example.com", "keshav@example.com", "rohit@example.com"].map { |user| User.find_by(email: user) }

companies.each do |company|
  users.each do |user|
    company.company_users.create!(user_id: user.id)
  end
end

puts "Company User Created"
# Company User End
