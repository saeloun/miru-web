# frozen_string_literal: true

# Company User Start
@c1.company_users.create!(user: @u1)
@c1.company_users.create!(user: @u2)
@c1.company_users.create!(user: @u3)
@c1.company_users.create!(user: @u4)
@c1.company_users.create!(user: @u5)

@c2.company_users.create!(user: @u2)
@c2.company_users.create!(user: @u5)
puts "Company User Created"
# Company User End
