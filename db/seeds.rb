# frozen_string_literal: true

Dir[File.join(Rails.root, "db", "seeds", "production", "*.rb")].sort.each do |seed|
  load seed
end

company = Company.create!(
  {
    name: "Saeloun Inc",
    address: "475 Clermont Ave, Brooklyn, NY-12238",
    business_phone: "+1 9296207865",
    base_currency: "USD",
    standard_price: 1000,
    fiscal_year_end: "jan-dec",
    date_format: "MM-DD-YYYY",
    country: "US",
    timezone: "America - New York"
  })

puts "Company Created"

company.logo.attach(io: File.open(Rails.root.join("app/assets/images/saeloun_logo.png")), filename: "saeloun_logo.png")

puts "Users Created"
vipul = User.create!(
  first_name: "Vipul", last_name: "A M", email: "vipul@example.com", password: "welcome",
  password_confirmation: "welcome", confirmed_at: Time.current, current_workspace_id: company.id)
supriya = User.create!(
  first_name: "Supriya", last_name: "Agarwal", email: "supriya@example.com", password: "welcome",
  password_confirmation: "welcome", confirmed_at: Time.current, current_workspace_id: company.id
)
book_keeper = User.create!(
  first_name: "Book", last_name: "Keeper", email: "book.keeper@example.com", password: "welcome",
  password_confirmation: "welcome", confirmed_at: Time.current, current_workspace_id: company.id
)
sam = User.create!(
  first_name: "Sam", last_name: "Smith", email: "sam@example.com", password: "welcome",
  password_confirmation: "welcome", confirmed_at: Time.current, current_workspace_id: company.id
)

vipul.add_role(:owner, company)
supriya.add_role(:admin, company)
book_keeper.add_role(:book_keeper, company)
sam.add_role(:employee, company)
puts "Users Roles Created"

users = [vipul, supriya, book_keeper, sam]

users.each { |user| company.employments.create!(user:) }
puts "Employment Created"

microsoft_client = company.clients.create!(
  name: "Microsoft", email: "support@example.com", phone: "+1 9999999991",
  address: "California, USA")

puts "Clients Created"

project_office_com = microsoft_client.projects.create!(name: "Office.com", description: "Office 365", billable: true)
project_azure_com = microsoft_client.projects.create!(name: "Azure.com", description: "Cloud Computing", billable: true)

Project.reindex

puts "Projects Created"

users.each do |user|
  user.project_members.create(project_id: project_office_com.id, hourly_rate: 5000)
  user.project_members.create(project_id: project_azure_com.id, hourly_rate: 5000)
end

puts "Projects Members Created"

timesheet_entry_start_date = (Date.today.beginning_of_month - 7)
timesheet_entry_end_date = (Date.today.end_of_month + 7)

project_azure_com.project_members.each do |project_member|
  (timesheet_entry_start_date..timesheet_entry_end_date).each do |date|
    TimesheetEntry.create!(
      user: project_member.user, project: project_member.project, duration: rand(1..1440),
      note: "Worked on #{project_azure_com.name}", bill_status: :unbilled, work_date: date)
  end
end
TimesheetEntry.reindex
puts "TimeSheet entries created"

invoice_1 = company.invoices.create!(
  issue_date: Date.today, due_date: 30.days.from_now,
  invoice_number: "SAI-C1-02", reference: "C1 2nd",
  amount: 5000, outstanding_amount: 2000, tax: 500, amount_paid: 3000,
  amount_due: 2000, discount: 500, status: 1, client_id: microsoft_client.id,
  external_view_key: "403dc4e964d2dedd7727ad556df58437")
invoice_2 = company.invoices.create!(
  issue_date: Date.today, due_date: 30.days.from_now,
  invoice_number: "SAI-C1-03", reference: "C1 3rd",
  amount: 5000, outstanding_amount: 0, tax: 500, amount_paid: 5000,
  amount_due: 0, discount: 500, status: 3, client_id: microsoft_client.id,
  external_view_key: "403dc4e964d2dedd7727ad556df58437")
Invoice.reindex
puts "Invoice Created"

company.addresses.create!(
  address_type: "permanent",
  address_line_1: "Saeloun Inc",
  address_line_2: "475 Clermont Ave",
  state: "NY",
  city: "Brooklyn",
  country: "US",
  pin: "12238"
)

users.each { |user| user.addresses.create!(
  address_type: "current",
  address_line_1: "Flat-1",
  address_line_2: "Apartment A1",
  state: "NY",
  city: "Brooklyn",
  country: "US",
  pin: "12238"
)
}

puts "Address Created"

users.each { |user| user.devices.create!(
  device_type: "laptop",
  name: "MacBook Pro",
  serial_number: "1111",
  company_id: 1
)
}

puts "Device Created"

users.each { |user| user.previous_employments.create!(
  company_name: "Oracle",
  role: "SDE"
)
}

puts "Previous Employment Created"

payment_1 = {
  amount: 3000,
  note: "This is payment note",
  status: :partially_paid,
  transaction_date: Date.today - 7,
  transaction_type: :visa
}
payment_2 = {
  amount: 5000,
  note: "This is payment note",
  status: :paid,
  transaction_date: Date.today - 3,
  transaction_type: :credit_card
}

invoice_1.payments.create!(payment_1)
invoice_2.payments.create!(payment_2)

puts "Payments Created"
