# frozen_string_literal: true

# User Create Start
users = [
  { first_name: "Vipul", last_name: "A M", email: "vipul@example.com", password: "password", password_confirmation: "password", confirmed_at: Time.current, invitation_accepted_at: Time.current, current_workspace_id: @saeloun_India.id },
  { first_name: "Supriya", last_name: "Agarwal", email: "supriya@example.com", password: "password", password_confirmation: "password", confirmed_at: Time.current, invitation_accepted_at: Time.current, current_workspace_id: @saeloun_India.id },
  { first_name: "Akhil", last_name: "G Krishnan", email: "akhil@example.com", password: "password", password_confirmation: "password", confirmed_at: Time.current, invitation_accepted_at: Time.current, current_workspace_id: @saeloun_India.id },
  { first_name: "Keshav", last_name: "Biswa", email: "keshav@example.com", password: "password", password_confirmation: "password", confirmed_at: Time.current, invitation_accepted_at: Time.current, current_workspace_id: @saeloun_India.id },
  { first_name: "Rohit", last_name: "Joshi", email: "rohit@example.com", password: "password", password_confirmation: "password", confirmed_at: Time.current, invitation_accepted_at: Time.current, current_workspace_id: @saeloun_India.id }
]
users.each { |user| User.create!(user) }
puts "Users Created"
@vipul, @supriya, @akhil, @keshav, @rohit = ["vipul@example.com", "supriya@example.com", "akhil@example.com", "keshav@example.com", "rohit@example.com"].map { |user| User.find_by(email: user) }
# User Create End
