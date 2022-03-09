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
seed_users  = User.where(email: users.map { |user| user[:email] })
puts "#{users.size} Users created"

clientData = [
  { name: "Saeloun LLC", email: "contact@saeloun.com" },
  { name: "Angel India", email: "hello@angel.co" }
]

company.clients.create!(clientData)
puts "Clients Created"

miru = Client.first.projects.create!(
  name: "Miru",
  description: "Timesheet app",
  billable: false
)

circle = Client.first.projects.create!(
  name: "Circle",
  description: "something round",
  billable: true
)

angel_india = Client.second.projects.create!(
  name: "Crypto Note",
  description: "1₹ = 1 Crypto Note",
  billable: true
)

angel = Client.second.projects.create!(
  name: "angellist",
  description: "sa",
  billable: true
)

miru_india = Client.first.projects.create!(
  name: "Miru 2",
  description: "An",
  billable: true
)


puts "Projects Created"

# Create project members
seed_users.each do |user|
  ProjectMember.create!(
    user: user,
    project: miru,
    hourly_rate: 5000
  )

  ProjectMember.create!(
    user: user,
    project: miru_india,
    hourly_rate: 5000
  )

  ProjectMember.create!(
    user: user,
    project: angel_india,
    hourly_rate: 6500
  )

  ProjectMember.create!(
    user: user,
    project: angel,
    hourly_rate: 6500
  )
end

puts "Project Members Created"

entry_info = {
  user: User.first,
  duration: 450,
  note: "Worked on UI",
  work_date: Date.today
}
entry_info_one = {
  user: User.first,
  duration: 450,
  note: "Worked on UI",
  work_date: Date.today + 1
}
entry_info_two = {
  user: User.first,
  duration: 450,
  note: "Worked on UI",
  work_date: Date.today + 2
}

5.times do
  miru.timesheet_entries.create!(entry_info)
  miru_india.timesheet_entries.create!(entry_info_one)
  miru_india.timesheet_entries.create!(entry_info_two)
  angel_india.timesheet_entries.create!(entry_info)
  angel.timesheet_entries.create!(entry_info_one)
end

puts "Timesheet Entries Created"
