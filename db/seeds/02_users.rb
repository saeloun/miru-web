# frozen_string_literal: true

# User Create Start
users = [
  {
    first_name: "Dharmdip", last_name: "Owner", email: "owner1@example.com", password: "password",
    password_confirmation: "password", confirmed_at: Time.current, invitation_accepted_at: Time.current,
    current_workspace_id: @c1.id
  },
  {
    first_name: "Natvar", last_name: "Owner", email: "owner2@example.com", password: "password",
    password_confirmation: "password", confirmed_at: Time.current, invitation_accepted_at: Time.current,
    current_workspace_id: @c1.id
  },
  {
    first_name: "Dharmdip", last_name: "Admin", email: "admin1@example.com", password: "password",
    password_confirmation: "password", confirmed_at: Time.current, invitation_accepted_at: Time.current,
    current_workspace_id: @c1.id
  },
  {
    first_name: "Natvar", last_name: "Admin", email: "admin2@example.com", password: "password",
    password_confirmation: "password", confirmed_at: Time.current, invitation_accepted_at: Time.current,
    current_workspace_id: @c1.id
  },
  {
    first_name: "Parth", last_name: "Employee", email: "employee1@example.com", password: "password",
    password_confirmation: "password", confirmed_at: Time.current, invitation_accepted_at: Time.current,
    current_workspace_id: @c1.id
  },
]
@users = users.map { |user| User.create!(user) }
puts "Users Created"
@u1, @u2, @u3, @u4, @u5 = users.map { |user|
  User.find_by(email: user[:email])
}
# User Create End
