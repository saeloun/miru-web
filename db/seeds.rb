# frozen_string_literal: true

# Create company
puts "Creating company"
company = Company.create!(
  name: "Saeloun Inc",
  address: "31R Providence Rd Westford MA, 01886",
  business_phone: "1111111111",
  country: "US",
  timezone: "EST"
)
puts "Company Created"

users = [
          { first_name: "Vipul", last_name: "A M", email: "vipul@example.com", role: :owner },
          { first_name: "Supriya", last_name: "Agarwal", email: "supriya@example.com", role: :admin },
          { first_name: "Akhil", last_name: "G Krishnan", email: "akhil@example.com", role: :employee }
        ]

puts "Creating users for #{company.name}"
users.each do |user|
  company_user = company.users.create!(
    first_name: user[:first_name],
    last_name: user[:last_name],
    email: user[:email],
    password: "password",
    password_confirmation: "password",
    confirmed_at: Time.current,
    invitation_accepted_at: Time.current,
    current_workspace_id: company.id
  )
  company_user.add_role(user[:role], company)
end

# # Company Create Start
# company_India = Company.create!(name: "Company India Pvt. Ltd", address: "somewhere in India", business_phone: "+91 0000000000", base_currency: "INR", standard_price: 100000, fiscal_year_end: "apr-mar", date_format: "DD-MM-YYYY", country: "IN", timezone: "Asia - Kolkata")
# company_US = Company.create!(name: "Company USA INC.", address: "somewhere in USA", business_phone: "+1 111111111", base_currency: "USD", standard_price: 1000, fiscal_year_end: "jan-dec", date_format: "YYYY-MM-DD", country: "US", timezone: "America - New York")
# company = [company_India, company_US]
# puts "Company Created"
# # Company Create End
#
# # # Create Role Start
# roles = [:owner, :admin, :employee]
# company.each do |company|
#   roles.each { |role| Role.create!(name: role, resource_type: Company, resource_id: company.id) }
# end
# puts "Roles Created"
# # # Create Role End
#
# # User Create Start
# users = [
#   { first_name: "Vipul", last_name: "A M", email: "vipul@example.com" },
#   { first_name: "Supriya", last_name: "Agarwal", email: "supriya@example.com" },
#   { first_name: "Akhil", last_name: "Biswa", email: "keshav@example.com" },
#   { first_name: "Keshav", last_name: "G Krishnan", email: "akhil@example.com" },
#   { first_name: "Rohit", last_name: "Joshi", email: "rohit@example.com" }
# ]
# users.each do |user|
#   User.create!(
#     first_name: user[:first_name],
#     last_name: user[:last_name],
#     email: user[:email],
#     password: "password",
#     password_confirmation: "password",
#     confirmed_at: Time.current,
#     invitation_accepted_at: Time.current,
#     current_workspace_id: company_India.id
#   )
# end
# puts "Users Created"
# # User Create End
#
# # User Roles Start
# user = User.where(email: users.map { |user| user[:email] })
# user[0].add_role(:owner, company_India)    # Vipul is Owner in Company India
# user[0].add_role(:owner, company_US)       # Vipul is Owner in Company US
# user[1].add_role(:admin, company_India)    # Supriya is Admin in Company India
# user[1].add_role(:admin, company_US)       # Supriya is Admin in Company US
# user[2].add_role(:employee, company_India) # Akhil is Employee is Company India
# user[2].add_role(:employee, company_US)    # Akhil is Employee is Company US
# user[3].add_role(:admin, company_India)    # Keshav is Admin is Company India
# user[3].add_role(:employee, company_US)    # Keshav is Employee is Company US
# user[4].add_role(:employee, company_India) # Rohit is Employee is Company India
# user[4].add_role(:admin, company_US)       # Rohit is Admin is Company US
# puts "Users Roles Created"
# # User Roles End
#
# # Client Create Start
# clients = [
#   { name: "Common client", email: "client@common.com" },
#   { name: "Company_India client_one", email: "client_one@company_india.com" },
#   { name: "Company_India client_two", email: "client_two@company_india.com" },
#   { name: "Company_US client_one", email: "client_one@company_india.com" },
#   { name: "Company_US client_two", email: "client_two@company_us.com" }
# ]
# company.each { |company| Client.create!(company_id: company.id, name:clients[0][:name], email:clients[0][:email], phone:company.business_phone, address:company.address ) }
# Client.create!(company_id: company.id, name:clients[0][:name], email:clients[0][:email], phone:company.business_phone, address:company.address ) }
# Client Create End
#
# users = [
#   { first_name: "Vipul", last_name: "A M", email: "vipul@example.com", role: :owner },
#   { first_name: "Supriya", last_name: "Agarwal", email: "supriya@example.com", role: :admin },
#   { first_name: "Akhil", last_name: "G Krishnan", email: "akhil@example.com", role: :employee }
# ]

# puts "Creating users for #{company.name}"
# users.each do |user|
#   company_user = company.users.create!(
#     first_name: user[:first_name],
#     last_name: user[:last_name],
#     email: user[:email],
#     password: "password",
#     password_confirmation: "password",
#     confirmed_at: Time.current,
#     invitation_accepted_at: Time.current,
#     current_workspace_id: company.id
#   )
#   company_user.add_role(user[:role], company)
# end
# seed_users  = User.where(email: users.map { |user| user[:email] })
# puts "#{users.size} Users created"
#
# clientData = [
#   { name: "Saeloun LLC", email: "contact@saeloun.com" },
#   { name: "Angel India", email: "hello@angel.co" }
# ]

# company.clients.create!(clientData)
# puts "Clients Created"
#
# miru = Client.first.projects.create!(
#   name: "Miru",
#   description: "Timesheet app",
#   billable: false
# )
#
# circle = Client.first.projects.create!(
#   name: "Circle",
#   description: "something round",
#   billable: true
# )
#
# angel_india = Client.second.projects.create!(
#   name: "Crypto Note",
#   description: "1₹ = 1 Crypto Note",
#   billable: true
# )
#
# angel = Client.second.projects.create!(
#   name: "angellist",
#   description: "sa",
#   billable: true
# )
#
# miru_india = Client.first.projects.create!(
#   name: "Miru 2",
#   description: "An",
#   billable: true
# )
#
#
# puts "Projects Created"
#
# # Create project members
# seed_users.each do |user|
#   ProjectMember.create!(
#     user: user,
#     project: miru,
#     hourly_rate: 5000
#   )
#
#   ProjectMember.create!(
#     user: user,
#     project: miru_india,
#     hourly_rate: 5000
#   )
#
#   ProjectMember.create!(
#     user: user,
#     project: angel_india,
#     hourly_rate: 6500
#   )
#
#   ProjectMember.create!(
#     user: user,
#     project: angel,
#     hourly_rate: 6500
#   )
# end
#
# puts "Project Members Created"
#
# entry_info = {
#   user: User.first,
#   duration: 450,
#   note: "Worked on UI",
#   work_date: Date.today
# }
# entry_info_one = {
#   user: User.first,
#   duration: 450,
#   note: "Worked on UI",
#   work_date: Date.today + 1
# }
# entry_info_two = {
#   user: User.first,
#   duration: 450,
#   note: "Worked on UI",
#   work_date: Date.today + 2
# }
#
# 5.times do
#   miru.timesheet_entries.create!(entry_info)
#   miru_india.timesheet_entries.create!(entry_info_one)
#   miru_india.timesheet_entries.create!(entry_info_two)
#   angel_india.timesheet_entries.create!(entry_info)
#   angel.timesheet_entries.create!(entry_info_one)
# end
#
# puts "Timesheet Entries Created"
