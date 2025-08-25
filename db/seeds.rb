# frozen_string_literal: true

require "faker"

# Create Company
company = Company.create!(
  name: "Saeloun Inc",
  address: Faker::Address.full_address,
  business_phone: Faker::PhoneNumber.phone_number,
  base_currency: "USD",
  standard_price: 1000,
  fiscal_year_end: "Dec",
  date_format: "MM-DD-YYYY",
  country: "US",
  timezone: "(GMT-10:00) America/Adak"
)

puts "Company Created"

# Attach logo if file exists
logo_path = Rails.root.join("app/assets/images/saeloun_logo.png")
if File.exist?(logo_path)
  company.logo.attach(io: File.open(logo_path), filename: "saeloun_logo.png")
end

# Create Users
super_admin = User.create!(
  first_name: "Saeloun",
  last_name: "Admin",
  email: "hello@saeloun.com",
  password: "password",
  password_confirmation: "password",
  confirmed_at: Time.current,
  current_workspace_id: company.id
)

vipul = User.create!(
  first_name: "Vipul",
  last_name: "AM",
  email: "vipul@saeloun.com",
  password: "password",
  password_confirmation: "password",
  confirmed_at: Time.current,
  current_workspace_id: company.id
)

# Create additional users with Faker
users_data = []
4.times do
  first_name = Faker::Name.first_name.gsub(/[^a-zA-Z\s]/, "")
  last_name = Faker::Name.last_name.gsub(/[^a-zA-Z\s]/, "")
  users_data << User.create!(
    first_name: first_name,
    last_name: last_name,
    email: Faker::Internet.unique.email(name: "#{first_name}.#{last_name}".downcase),
    password: "password",
    password_confirmation: "password",
    confirmed_at: Time.current,
    current_workspace_id: company.id
  )
end

supriya = users_data[0]
book_keeper = users_data[1]
sam = users_data[2]
oliver = users_data[3]

puts "Users Created"

# Assign Roles
super_admin.add_role(:super_admin)
super_admin.add_role(:owner, company)
vipul.add_role(:owner, company)
supriya.add_role(:admin, company)
book_keeper.add_role(:book_keeper, company)
sam.add_role(:employee, company)
oliver.add_role(:client, company)

puts "Users Roles Created"

# Create Employments
users = [super_admin, vipul, supriya, book_keeper, sam]
users.each { |user| company.employments.create!(user: user) }
company.employments.create!(user: oliver)

puts "Employment Created"

# Create Clients
clients = []
3.times do
  client = company.clients.create!(
    name: Faker::Company.unique.name,
    email: Faker::Internet.unique.email,
    phone: Faker::PhoneNumber.phone_number
  )

  client.addresses.create!(
    address_line_1: Faker::Address.street_address,
    city: Faker::Address.city,
    state: Faker::Address.state,
    pin: Faker::Address.zip_code,
    country: "US"
  )

  clients << client
end

microsoft_client = clients.first

puts "Clients Created"

# Create Client Members
company.client_members.create!(client: microsoft_client, user: oliver)

puts "Client member created"

# Create Projects
projects = []
clients.each do |client|
  2.times do
    project = client.projects.create!(
      name: Faker::App.unique.name,
      description: Faker::Lorem.sentence(word_count: 10),
      billable: true
    )
    projects << project
  end
end

puts "Projects Created"

# Create Project Members
users.each do |user|
  projects.sample(3).each do |project|
    user.project_members.create!(
      project_id: project.id,
      hourly_rate: Faker::Number.between(from: 3000, to: 8000)
    )
  end
end

puts "Projects Members Created"

# Create Holidays for 2025
holiday = Holiday.find_or_create_by!(
  year: 2025,
  company_id: company.id,
  enable_optional_holidays: false,
  holiday_types: ["national", "optional"]
)

# US holidays for 2025
us_holidays = [
  { date: Date.new(2025, 1, 1), name: "New Year Day", national_holiday: true },
  { date: Date.new(2025, 1, 20), name: "Martin Luther King Jr Day", national_holiday: true },
  { date: Date.new(2025, 2, 17), name: "Presidents Day", national_holiday: true },
  { date: Date.new(2025, 5, 26), name: "Memorial Day", national_holiday: true },
  { date: Date.new(2025, 6, 19), name: "Juneteenth", national_holiday: true },
  { date: Date.new(2025, 7, 4), name: "Independence Day", national_holiday: true },
  { date: Date.new(2025, 9, 1), name: "Labor Day", national_holiday: true },
  { date: Date.new(2025, 10, 13), name: "Columbus Day", national_holiday: false },
  { date: Date.new(2025, 11, 11), name: "Veterans Day", national_holiday: true },
  { date: Date.new(2025, 11, 27), name: "Thanksgiving", national_holiday: true },
  { date: Date.new(2025, 12, 25), name: "Christmas Day", national_holiday: true }
]

us_holidays.each do |holiday_data|
  HolidayInfo.find_or_create_by!(
    holiday_id: holiday.id,
    date: holiday_data[:date],
    name: holiday_data[:name],
    category: holiday_data[:national_holiday] ? "national" : "optional"
  )
end

puts "Holidays created"

# Create Timesheet Entries
puts "Creating timesheet entries..."
timesheet_start_date = 2.months.ago.beginning_of_month
timesheet_end_date = Date.today

users.each do |user|
  user.project_members.each do |project_member|
    project = project_member.project

    (timesheet_start_date.to_date..timesheet_end_date.to_date).each do |date|
      # Skip weekends
      next if date.saturday? || date.sunday?

      # Random chance of working (75% chance on weekdays)
      next unless rand < 0.75

      duration = Faker::Number.between(from: 240, to: 480) # 4-8 hours in minutes
      TimesheetEntry.create!(
        user: user,
        project: project,
        duration: duration,
        note: ["Development", "Testing", "Code Review", "Meeting", "Documentation"].sample,
        bill_status: :unbilled,
        work_date: date
      )
    end
  end
end

puts "Timesheet entries created"

# Create Invoices using month counts
puts "Creating invoices..."
invoice_number = 1

# Create invoices for last 12 months
(1..12).each do |month_count|
  # Generate invoice date as month_count months ago minus random days
  invoice_date = month_count.months.ago - rand(1..28).days

  clients.sample(2).each do |client|
    amount = Faker::Number.between(from: 5000, to: 25000)
    tax = Faker::Number.between(from: 500, to: 2500)
    discount = Faker::Number.between(from: 0, to: 500)
    total_amount = amount + tax - discount

    status = [:paid, :sent, :draft].sample

    amount_paid = case status
                  when :paid then total_amount
                  else 0
    end

    amount_due = total_amount - amount_paid
    outstanding_amount = status == :paid ? 0 : amount_due

    invoice = Invoice.create!(
      issue_date: invoice_date.to_date,
      due_date: invoice_date.to_date + 30.days,
      invoice_number: "INV#{invoice_number.to_s.rjust(4, '0')}",
      reference: "REF#{invoice_number}",
      amount: amount,
      outstanding_amount: outstanding_amount,
      tax: tax,
      amount_paid: amount_paid,
      amount_due: amount_due,
      discount: discount,
      status: status,
      client_id: client.id,
      company_id: company.id,
      external_view_key: SecureRandom.hex(16),
      sent_at: status == :sent ? invoice_date.to_date + 1.day : nil,
      currency: "USD",
      base_currency_amount: amount
    )

    # Add payment for paid invoices
    if status == :paid
      invoice.payments.create!(
        amount: total_amount,
        note: Faker::Lorem.sentence(word_count: 3),
        status: :paid,
        transaction_date: invoice_date.to_date + rand(5..20).days,
        transaction_type: [:credit_card, :bank_transfer].sample
      )
    end

    invoice_number += 1
  end
end

puts "Invoices created"

# Create Addresses
company.addresses.create!(
  address_type: "permanent",
  address_line_1: Faker::Address.street_address,
  address_line_2: Faker::Address.secondary_address,
  state: Faker::Address.state_abbr,
  city: Faker::Address.city,
  country: "US",
  pin: Faker::Address.zip_code
)

users.each do |user|
  user.addresses.create!(
    address_type: "current",
    address_line_1: Faker::Address.street_address,
    address_line_2: Faker::Address.secondary_address,
    state: Faker::Address.state_abbr,
    city: Faker::Address.city,
    country: "US",
    pin: Faker::Address.zip_code
  )
end

puts "Addresses Created"

# Create Devices
users.each do |user|
  user.devices.create!(
    device_type: "laptop",
    name: ["MacBook Pro", "Dell XPS", "iPhone", "Surface Pro"].sample,
    serial_number: Faker::Alphanumeric.alphanumeric(number: 10).upcase,
    company_id: company.id
  )
end

puts "Devices Created"

# Create Previous Employments
users.each do |user|
  user.previous_employments.create!(
    company_name: Faker::Company.name,
    role: Faker::Job.title
  )
end

puts "Previous Employment Created"

# Create Expense Categories
ExpenseCategory::DEFAULT_CATEGORIES.each do |category|
  ExpenseCategory.find_or_create_by!(category)
end

custom_categories = []
["Travel", "Training", "Marketing"].each do |name|
  custom_categories << company.expense_categories.create!(name: name)
end

puts "Expense categories created"

# Create Vendors
vendors = []
5.times do
  vendors << company.vendors.create!(
    name: Faker::Company.unique.name
  )
end

puts "Vendors created"

# Create Expenses
15.times do
  company.expenses.create!(
    amount: Faker::Number.between(from: 500, to: 10000),
    date: Faker::Date.between(from: 2.months.ago, to: Date.today),
    description: Faker::Lorem.sentence(word_count: 5),
    expense_category_id: ExpenseCategory.all.sample.id,
    vendor_id: vendors.sample.id,
    expense_type: [:business, :personal].sample
  )
end

puts "Expenses Created"

puts "✅ Seeding completed successfully!"
