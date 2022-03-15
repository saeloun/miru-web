# frozen_string_literal: true

# Company User Start
company_India, company_US = Company.first(2)
vipul, supriya, akhil, keshav, rohit = User.first(5)

[company_India, company_US].each do |company|
  [vipul, supriya, akhil, keshav, rohit].each do |user|
    company.company_users.create!(user_id: user.id)
  end
end
# Company User End
