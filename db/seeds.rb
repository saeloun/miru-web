# frozen_string_literal: true

if ENV["CI"]
  Searchkick.disable_callbacks
end

company = Company.create!(
  {
    name: "Saeloun Inc",
    address: "475 Clermont Ave, Brooklyn, NY-12238",
    business_phone: "+1 9296207865",
    base_currency: "USD",
    standard_price: 1000,
    fiscal_year_end: "Dec",
    date_format: "MM-DD-YYYY",
    country: "US",
    timezone: "(GMT-10:00) America/Adak"
  })

puts "Company Created"

company.logo.attach(io: File.open(Rails.root.join("app/assets/images/saeloun_logo.png")), filename: "saeloun_logo.png")

puts "Users Created"
super_admin = User.create!(
  first_name: "Saeloun", last_name: "Admin", email: "hello@saeloun.com", password: "welcome",
  password_confirmation: "welcome", confirmed_at: Time.current)
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
oliver = User.create!(
  first_name: "Oliver", last_name: "Smith", email: "oliver@example.com", password: "welcome",
  password_confirmation: "welcome", confirmed_at: Time.current, current_workspace_id: company.id
)

super_admin.add_role(:super_admin)
vipul.add_role(:owner, company)
supriya.add_role(:admin, company)
book_keeper.add_role(:book_keeper, company)
sam.add_role(:employee, company)
oliver.add_role(:client, company)
puts "Users Roles Created"

users = [vipul, supriya, book_keeper, sam]

users.each { |user| company.employments.create!(user:) }
company.employments.create!(user: oliver)
puts "Employment Created"

microsoft_client = company.clients.create!(
  name: "Microsoft",
  email: oliver.email,
  phone: "+1 9999999991"
)

puts "Clients Created"

company.client_members.create!(client: microsoft_client, user: oliver)

puts "Client member created"

microsoft_client.addresses.create!(
  address_line_1: "475 Clermont Ave",
  city: "Brooklyn",
  state: "New york",
  pin: "12238",
  country: "US"
)

Client.reindex

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
  company_id: company.id
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

ExpenseCategory::DEFAULT_CATEGORIES.each do |category|
  ExpenseCategory.find_or_create_by!(category)
end

puts "Default expense categories created"

outing_category = company.expense_categories.create!({ name: "Outing" })
conference_category = company.expense_categories.create!({ name: "Conference" })

puts "Custom expense Categories created"

ca_vendor = company.vendors.create!({ name: "CA firm" })
insurance_vendor = company.vendors.create!({ name: "Insurance" })
booking_vendor = company.vendors.create!({ name: "Booking" })
apple_repair_vendor = company.vendors.create!({ name: "Apple Maintenance" })

puts "Vendors created"

expenses = [
  {
    amount: 300000,
    date: Faker::Date.backward(days: 60),
    description: "Salary of x,y,z employee",
    expense_category_id: 1,
    expense_type: :business
  },
  {
    amount: 5500,
    date: Faker::Date.backward(days: 60),
    description: "Laptop's servicing Employee 1",
    expense_category_id: 2,
    vendor_id: apple_repair_vendor.id,
    expense_type: :business
  },
  {
    amount: 10000,
    date: Faker::Date.backward(days: 60),
    description: "Monthly rent",
    expense_category_id: 3,
    expense_type: :business
  },
  {
    amount: 2000,
    date: Faker::Date.backward(days: 60),
    description: "Dinner party",
    expense_category_id: 4,
    vendor_id: booking_vendor.id,
    expense_type: :personal
  },
  {
    amount: 67000,
    date: Faker::Date.backward(days: 60),
    description: "Flight to NY",
    expense_category_id: 5,
    vendor_id: booking_vendor.id,
    expense_type: :business
  },
  {
    amount: 47000,
    date: Faker::Date.backward(days: 60),
    description: "Employee x Client visit",
    expense_category_id: 5,
    vendor_id: booking_vendor.id,
    expense_type: :business
  },
  {
    amount: 56703,
    date: Faker::Date.backward(days: 60),
    description: "Govt Tax",
    expense_category_id: 6,
    vendor_id: ca_vendor.id,
    expense_type: :business
  },
  {
    amount: 4350,
    date: Faker::Date.backward(days: 60),
    description: "Office new chair",
    expense_category_id: 7,
    vendor_id: booking_vendor.id,
    expense_type: :business
  },
  {
    amount: 20000,
    date: Faker::Date.backward(days: 60),
    description: "x,y,z employee health insurance",
    expense_category_id: 8,
    vendor_id: insurance_vendor.id,
    expense_type: :business
  },
  {
    amount: 6300,
    date: Faker::Date.backward(days: 60),
    description: "Some xyz expense",
    expense_category_id: 9,
    vendor_id: booking_vendor.id,
    expense_type: :personal
  },
  {
    amount: 12300,
    date: Faker::Date.backward(days: 60),
    description: "Team Vacation",
    expense_category_id: outing_category.id,
    vendor_id: booking_vendor.id,
    expense_type: :business
  },
  {
    amount: 5400,
    date: Faker::Date.backward(days: 60),
    description: "Rails Conf ticket",
    expense_category_id: conference_category.id,
    vendor_id: booking_vendor.id,
    expense_type: :business
  }
]

expenses.each do |expense|
  company.expenses.create!(expense)
end

puts "Expenses Created"
