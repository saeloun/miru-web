# frozen_string_literal: true

test_password = ENV.fetch("SANITIZED_SUBSET_TEST_PASSWORD", "password")
company = Company.find_by(name: "Saeloun Inc") || Company.first

canonical_roles = {
  "vipul@saeloun.com" => :owner,
  "hello@saeloun.com" => :owner,
  "supriya@saeloun.com" => :admin,
  "sonam@saeloun.com" => :admin,
  "accounts@saeloun.com" => :book_keeper,
  "keshav@saeloun.com" => :employee,
  "amit@saeloun.com" => :employee,
  "finance@example.com" => :client,
  "maya.client@example.com" => :client,
  "oliver@example.com" => :client
}

User.find_each do |user|
  user_attrs = {
    encrypted_password: Devise::Encryptor.digest(User, test_password),
    confirmed_at: user.confirmed_at || Time.current,
    reset_password_token: nil,
    reset_password_sent_at: nil
  }
  user_attrs[:password_changed_at] = Time.current if user.has_attribute?(:password_changed_at)

  user.update_columns(user_attrs)
end

if company.present?
  canonical_roles.each do |email, role_name|
    user = User.find_by(email: email)
    next unless user

    user.remove_roles_for(company)
    user.add_role(role_name, company)
    user.update_column(:current_workspace_id, company.id) if user.has_attribute?(:current_workspace_id)
  end
end

puts(
  {
    users: User.count,
    password: test_password,
    company_id: company&.id,
    canonical_roles: canonical_roles.transform_values(&:to_s),
    sample_emails: User.order(:email).limit(10).pluck(:email)
  }.inspect
)
