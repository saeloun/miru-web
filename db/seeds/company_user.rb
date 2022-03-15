# frozen_string_literal: true

# Company User Start
saeloun_India, saeloun_US = Company.first(2)
vipul, supriya, akhil, keshav, rohit = User.first(5)

[saeloun_India, saeloun_US].each do |company|
  [vipul, supriya, akhil, keshav, rohit].each do |user|
    company.company_users.create!(user_id: user.id)
  end
end
# Company User End
