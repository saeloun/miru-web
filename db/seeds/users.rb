# frozen_string_literal: true

# User Create Start
company = Company.first
users = [
  { first_name: "Vipul", last_name: "A M", email: "vipul@example.com" },
  { first_name: "Supriya", last_name: "Agarwal", email: "supriya@example.com" },
  { first_name: "Akhil", last_name: "G Krishnan", email: "akhil@example.com" },
  { first_name: "Keshav", last_name: "Biswa", email: "keshav@example.com" },
  { first_name: "Rohit", last_name: "Joshi", email: "rohit@example.com" }
]
users.each do |user|
  User.create!(
    first_name: user[:first_name],
    last_name: user[:last_name],
    email: user[:email],
    password: "password",
    password_confirmation: "password",
    confirmed_at: Time.current,
    invitation_accepted_at: Time.current,
    current_workspace_id: company.id
  )
end
puts "Users Created"
# User Create End
