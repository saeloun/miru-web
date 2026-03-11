# frozen_string_literal: true

test_password = ENV.fetch("SANITIZED_SUBSET_TEST_PASSWORD", "password")

User.find_each do |user|
  user.password = test_password
  user.password_confirmation = test_password
  user.confirmed_at ||= Time.current
  user.reset_password_token = nil
  user.reset_password_sent_at = nil
  user.save!
end

puts(
  {
    users: User.count,
    password: test_password,
    sample_emails: User.order(:email).limit(10).pluck(:email)
  }.inspect
)
