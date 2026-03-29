# frozen_string_literal: true

require "faker"

Faker::Config.random = Random.new(2025)
Faker::UniqueGenerator.clear

START_DATE = Date.new(2025, 1, 1)
END_DATE = Date.current
PASSWORD = "password"

def phone(number)
  number.to_s.gsub(/[^0-9+]/, "")[0, 15]
end

def money(cents)
  BigDecimal(cents.to_s) / 100
end

def ensure_address!(addressable, attributes)
  address = addressable.addresses.first_or_initialize
  address.update!(attributes)
  address
end

def ensure_notification_preference!(user, company)
  preference = NotificationPreference.find_or_initialize_by(user:, company:)
  preference.update!(
    notification_enabled: true,
    invoice_email_notifications: true,
    payment_email_notifications: true,
    timesheet_reminder_enabled: true,
    unsubscribed_from_all: false
  )
end

def ensure_user!(company:, first_name:, last_name:, email:, roles:, current_workspace: true, super_admin: false)
  user = User.find_or_initialize_by(email:)
  user.assign_attributes(
    first_name:,
    last_name:,
    password: PASSWORD,
    password_confirmation: PASSWORD,
    confirmed_at: Time.current,
    current_workspace_id: current_workspace ? company.id : user.current_workspace_id
  )
  user.save!

  Employment.find_or_create_by!(company:, user:)
  user.current_workspace = company if current_workspace
  user.save!

  user.roles.where(resource: company).find_each do |role|
    user.remove_role(role.name.to_sym, company)
  end

  roles.each do |role|
    user.add_role(role, company) unless user.has_role?(role, company)
  end

  user.add_role(:super_admin) if super_admin && !user.has_role?(:super_admin)

  ensure_address!(
    user,
    address_type: "current",
    address_line_1: "475 Clermont Ave",
    address_line_2: "Suite #{100 + user.id.to_i}",
    city: "Brooklyn",
    state: "NY",
    country: "US",
    pin: "11238"
  )

  if user.devices.blank?
    user.devices.create!(
      company_id: company.id,
      device_type: "laptop",
      name: "MacBook Pro",
      serial_number: "MBP-#{user.id.to_s.rjust(4, '0')}"
    )
  end

  if user.previous_employments.blank?
    user.previous_employments.create!(company_name: "Example Corp", role: "Engineer")
  end

  ensure_notification_preference!(user, company)
  user
end

def ensure_client!(company:, name:, email:, phone_number:, member: nil)
  client = company.clients.find_or_initialize_by(email:)
  client.update!(
    name:,
    phone: phone(phone_number),
    currency: company.base_currency
  )

  ensure_address!(
    client,
    address_type: "permanent",
    address_line_1: "#{name} HQ",
    address_line_2: "Accounts Payable",
    city: "San Francisco",
    state: "CA",
    country: "US",
    pin: "94105"
  )

  if member
    ClientMember.find_or_create_by!(company:, client:, user: member)
  end

  client
end

def ensure_project!(client:, name:, description:, billable: true)
  project = client.projects.find_or_initialize_by(name:)
  project.update!(description:, billable:)
  project
end

def ensure_project_member!(project:, user:, hourly_rate:)
  membership = ProjectMember.find_or_initialize_by(project:, user:)
  membership.update!(hourly_rate:)
  membership
end

def seeded_holidays_for(year)
  [
    { date: Date.new(year, 1, 1), name: "New Years Day", category: :national },
    { date: Date.new(year, 1, 20), name: "Martin Luther King Jr Day", category: :national },
    { date: Date.new(year, 2, 17), name: "Presidents Day", category: :optional },
    { date: Date.new(year, 5, 26), name: "Memorial Day", category: :national },
    { date: Date.new(year, 6, 19), name: "Juneteenth", category: :national },
    { date: Date.new(year, 7, 4), name: "Independence Day", category: :national },
    { date: Date.new(year, 9, 1), name: "Labor Day", category: :national },
    { date: Date.new(year, 10, 13), name: "Columbus Day", category: :optional },
    { date: Date.new(year, 11, 27), name: "Thanksgiving", category: :national },
    { date: Date.new(year, 12, 25), name: "Christmas Day", category: :national }
  ]
end

company = Company.find_or_initialize_by(name: "Saeloun Inc")
company.update!(
  address: "475 Clermont Ave, Brooklyn, NY 11238",
  business_phone: phone("+1 9296207865"),
  base_currency: "USD",
  standard_price: 1250,
  fiscal_year_end: "Dec",
  date_format: "MM-DD-YYYY",
  country: "US",
  timezone: "(GMT-10:00) America/Adak",
  bank_name: "Mercury",
  bank_account_number: "1234567890",
  bank_routing_number: "021000021",
  bank_swift_code: "CHASUS33",
  tax_id: "12-3456789",
  vat_number: "US-998877",
  gst_number: "GST-10001",
  plan_tier: "paid",
  billing_exempt: true
)

logo_path = Rails.root.join("app/assets/images/saeloun_logo.png")
company.logo.attach(io: File.open(logo_path), filename: "saeloun_logo.png") if File.exist?(logo_path) && !company.logo.attached?

ensure_address!(
  company,
  address_type: "permanent",
  address_line_1: "475 Clermont Ave",
  address_line_2: "Floor 3",
  city: "Brooklyn",
  state: "NY",
  country: "US",
  pin: "11238"
)

puts "Company ready: #{company.name}"

owner = ensure_user!(company:, first_name: "Vipul", last_name: "AM", email: "vipul@saeloun.com", roles: [:owner])
super_admin = ensure_user!(company:, first_name: "Saeloun", last_name: "Admin", email: "hello@saeloun.com", roles: [:owner], super_admin: true)
admin = ensure_user!(company:, first_name: "Supriya", last_name: "Agarwal", email: "supriya@saeloun.com", roles: [:admin])
book_keeper = ensure_user!(company:, first_name: "Accounts", last_name: "Saeloun", email: "accounts@saeloun.com", roles: [:book_keeper])
employee_1 = ensure_user!(company:, first_name: "Sonam", last_name: "Saeloun", email: "sonam@saeloun.com", roles: [:employee])
employee_2 = ensure_user!(company:, first_name: "Keshav", last_name: "Saeloun", email: "keshav@saeloun.com", roles: [:employee])
employee_3 = ensure_user!(company:, first_name: "Amit", last_name: "Saeloun", email: "amit@saeloun.com", roles: [:employee])
client_user_1 = ensure_user!(company:, first_name: "Olivia", last_name: "Client", email: "oliver@example.com", roles: [:client])
client_user_2 = ensure_user!(company:, first_name: "Maya", last_name: "Stakeholder", email: "maya.client@example.com", roles: [:client])
client_user_3 = ensure_user!(company:, first_name: "Finance", last_name: "Microsoft", email: "finance.microsoft@example.com", roles: [:client])
client_user_4 = ensure_user!(company:, first_name: "Accounts", last_name: "Acme", email: "accounts.acme@example.com", roles: [:client])

users = [super_admin, owner, admin, book_keeper, employee_1, employee_2, employee_3]
employees = [owner, admin, book_keeper, employee_1, employee_2, employee_3]
client_users = [client_user_1, client_user_2, client_user_3, client_user_4]

puts "Users ready: #{(users + client_users).map(&:email).join(', ')}"

clients = [
  ensure_client!(company:, name: "Microsoft", email: client_user_3.email, phone_number: "+1 4155550101", member: client_user_3),
  ensure_client!(company:, name: "Acme Labs", email: client_user_4.email, phone_number: "+1 4155550102", member: client_user_4),
  ensure_client!(company:, name: "Northwind Studio", email: client_user_2.email, phone_number: "+1 4155550103", member: client_user_2),
  ensure_client!(company:, name: "Pinecone Health", email: "ops@pineconehealth.com", phone_number: "+1 4155550104")
]

ClientMember.find_or_create_by!(company:, client: clients[0], user: client_user_1)
ClientMember.find_or_create_by!(company:, client: clients[0], user: client_user_3)
ClientMember.find_or_create_by!(company:, client: clients[1], user: client_user_4)
ClientMember.find_or_create_by!(company:, client: clients[2], user: client_user_2)
ClientMember.find_or_create_by!(company:, client: clients[2], user: client_user_1)
ClientMember.find_or_create_by!(company:, client: clients[3], user: client_user_2)

projects = [
  ensure_project!(client: clients[0], name: "Office.com", description: "Platform delivery and reporting"),
  ensure_project!(client: clients[0], name: "Azure Growth", description: "Enterprise launch support"),
  ensure_project!(client: clients[1], name: "Acme Revamp", description: "Website redesign and analytics"),
  ensure_project!(client: clients[1], name: "Acme Retainer", description: "Ongoing product support"),
  ensure_project!(client: clients[2], name: "Northwind Mobile", description: "Mobile app iteration"),
  ensure_project!(client: clients[3], name: "Pinecone Operations", description: "Operations tooling and support")
]

project_rates = {
  owner => 16000,
  admin => 14000,
  book_keeper => 9000,
  employee_1 => 11000,
  employee_2 => 10500,
  employee_3 => 9800
}

projects.each_with_index do |project, index|
  employees.each do |user|
    next if user == book_keeper && index.odd?

    ensure_project_member!(project:, user:, hourly_rate: project_rates.fetch(user))
  end
end

puts "Projects ready: #{projects.size}"

[2025, 2026].each do |year|
  holiday = Holiday.find_or_initialize_by(company:, year:)
  holiday.update!(
    enable_optional_holidays: true,
    no_of_allowed_optional_holidays: 2,
    holiday_types: %w[national optional],
    time_period_optional_holidays: :per_year
  )

  seeded_holidays_for(year).each do |attrs|
    info = HolidayInfo.find_or_initialize_by(holiday:, date: attrs[:date])
    info.update!(name: attrs[:name], category: attrs[:category])
  end
end

leave_2025 = Leave.find_or_initialize_by(company:, year: 2025)
leave_2025.save!
leave_2026 = Leave.find_or_initialize_by(company:, year: 2026)
leave_2026.save!

leave_types = [
  { leave: leave_2025, name: "Vacation", icon: :vacation, color: :chart_blue, allocation_value: 18, allocation_period: :days, allocation_frequency: :per_year, carry_forward_days: 5 },
  { leave: leave_2025, name: "Sick Leave", icon: :medicine, color: :chart_green, allocation_value: 10, allocation_period: :days, allocation_frequency: :per_year, carry_forward_days: 0 },
  { leave: leave_2025, name: "Personal", icon: :user, color: :chart_purple, allocation_value: 6, allocation_period: :days, allocation_frequency: :per_year, carry_forward_days: 0 },
  { leave: leave_2026, name: "Vacation", icon: :vacation, color: :chart_blue, allocation_value: 18, allocation_period: :days, allocation_frequency: :per_year, carry_forward_days: 5 },
  { leave: leave_2026, name: "Sick Leave", icon: :medicine, color: :chart_green, allocation_value: 10, allocation_period: :days, allocation_frequency: :per_year, carry_forward_days: 0 },
  { leave: leave_2026, name: "Personal", icon: :user, color: :chart_purple, allocation_value: 6, allocation_period: :days, allocation_frequency: :per_year, carry_forward_days: 0 }
]

leave_type_records = leave_types.map do |attrs|
  leave_type = LeaveType.find_or_initialize_by(leave: attrs[:leave], name: attrs[:name])
  leave_type.update!(attrs.except(:leave))
  leave_type
end

employees.each do |user|
  Carryover.find_or_create_by!(
    user:,
    company:,
    leave_type: leave_type_records.find { |record| record.leave == leave_2026 && record.name == "Vacation" },
    from_year: 2025,
    to_year: 2026,
    total_leave_balance: 3,
    duration: 2
  )
end

timeoff_seed = [
  [employee_1, Date.new(2025, 2, 14), "Vacation", 480],
  [employee_1, Date.new(2025, 7, 18), "Vacation", 480],
  [employee_2, Date.new(2025, 3, 7), "Sick Leave", 480],
  [employee_2, Date.new(2025, 11, 3), "Personal", 240],
  [employee_3, Date.new(2025, 8, 22), "Vacation", 480],
  [owner, Date.new(2025, 12, 26), "Vacation", 480]
]

timeoff_seed.each do |user, leave_date, leave_name, duration|
  leave_record = leave_date.year == 2025 ? leave_2025 : leave_2026
  leave_type = leave_type_records.find { |record| record.leave == leave_record && record.name == leave_name }
  TimeoffEntry.find_or_create_by!(user:, leave_type:, leave_date:) do |entry|
    entry.duration = duration
  end
end

optional_holiday = HolidayInfo.joins(:holiday).find_by(holidays: { company_id: company.id, year: 2025 }, name: "Presidents Day")
TimeoffEntry.find_or_create_by!(user: employee_1, holiday_info: optional_holiday, leave_date: optional_holiday.date) do |entry|
  entry.duration = 480
end

puts "Leave data ready"

receipt_path = Rails.root.join("spec/fixtures/files/test-image.png")

employees.each do |user|
  projects_for_user = user.projects.kept.order(:id).limit(2)
  next if projects_for_user.empty?

  (START_DATE..END_DATE).each do |work_date|
    next if work_date.saturday? || work_date.sunday?
    next if work_date > END_DATE
    next if work_date.month == 12 && work_date.day > 20

    projects_for_user.each_with_index do |project, index|
      next if (work_date.yday + user.id + index) % 3 == 0

      entry = TimesheetEntry.find_or_initialize_by(user:, project:, work_date:)
      duration = 180 + (((work_date.yday + user.id + index) % 5) * 60)
      entry.update!(
        duration:,
        note: ["Feature delivery", "Support and triage", "Planning", "Client sync", "QA and review"][(work_date.yday + index) % 5],
        bill_status: :unbilled,
        locked: false
      )
    end
  end
end

puts "Timesheet entries ready"

invoice_counter = 1
projects.group_by(&:client).each_with_index do |(client, client_projects), client_index|
  month_cursor = START_DATE.beginning_of_month

  while month_cursor <= END_DATE.beginning_of_month
    grouped_entries = TimesheetEntry.kept
      .where(project: client_projects, work_date: month_cursor..month_cursor.end_of_month)
      .order(:work_date)

    if grouped_entries.exists?
      subtotal_cents = grouped_entries.sum { |entry| ((entry.duration / 60.0) * project_rates.fetch(entry.user)).round }
      tax_cents = (subtotal_cents * 0.1).round
      discount_cents = ((client_index + month_cursor.month) % 4 == 0 ? 5000 : 0)
      total_cents = subtotal_cents + tax_cents - discount_cents

      status = if month_cursor >= Date.current.beginning_of_month
        :draft
      elsif month_cursor > 2.months.ago.beginning_of_month
        :sent
      elsif month_cursor > 4.months.ago.beginning_of_month
        :viewed
      else
        :paid
      end

      amount_paid_cents = status == :paid ? total_cents : (status == :viewed ? (total_cents * 0.5).round : 0)
      amount_due_cents = total_cents - amount_paid_cents

      invoice = Invoice.find_or_initialize_by(company:, invoice_number: "MIRU-#{invoice_counter.to_s.rjust(4, '0')}")
      invoice.update!(
        client:,
        issue_date: month_cursor.end_of_month,
        due_date: month_cursor.end_of_month + 15.days,
        reference: "FY#{month_cursor.year}#{month_cursor.month.to_s.rjust(2, '0')}",
        amount: money(subtotal_cents),
        tax: money(tax_cents),
        discount: money(discount_cents),
        amount_paid: money(amount_paid_cents),
        amount_due: money(amount_due_cents),
        outstanding_amount: money(amount_due_cents),
        status:,
        currency: company.base_currency,
        base_currency_amount: money(total_cents),
        sent_at: status == :draft ? nil : month_cursor.end_of_month + 1.day
      )

      invoice.invoice_line_items.destroy_all
      grouped_entries.limit(6).each do |entry|
        hours = (entry.duration / 60.0)
        rate = money(project_rates.fetch(entry.user))
        invoice.invoice_line_items.create!(
          name: "#{entry.project.name} work",
          description: entry.note,
          date: entry.work_date,
          quantity: hours,
          rate:,
          timesheet_entry_id: entry.id
        )
      end

      if invoice.amount_paid.positive?
        payment = invoice.payments.find_or_initialize_by(name: "Seed payment #{invoice.invoice_number}")
        payment.update!(
          amount: invoice.amount_paid,
          transaction_date: invoice.issue_date + 10.days,
          transaction_type: :bank_transfer,
          payment_currency: company.base_currency
        )
      end

      invoice_counter += 1
    end

    month_cursor = month_cursor.next_month
  end
end

puts "Invoices and payments ready"

expense_rows = [
  { user: employee_1, category_name: "Travel", vendor_name: "Delta", description: "Flight for client workshop", amount: 825_00, date: Date.new(2025, 2, 10), expense_type: :business, status: :paid, paid_at: Date.new(2025, 2, 20) },
  { user: employee_2, category_name: "Meals", vendor_name: "Sweetgreen", description: "Team lunch with client", amount: 124_50, date: Date.new(2025, 3, 12), expense_type: :business, status: :approved },
  { user: employee_3, category_name: "Office", vendor_name: "Staples", description: "Desk accessories and cables", amount: 210_75, date: Date.new(2025, 4, 4), expense_type: :business, status: :submitted },
  { user: book_keeper, category_name: "Software", vendor_name: "Figma", description: "Design tool renewal", amount: 540_00, date: Date.new(2025, 5, 1), expense_type: :business, status: :paid, paid_at: Date.new(2025, 5, 2) },
  { user: owner, category_name: "Travel", vendor_name: "Uber", description: "Airport transfer", amount: 68_25, date: Date.new(2025, 6, 14), expense_type: :business, status: :rejected },
  { user: employee_1, category_name: "Training", vendor_name: "RailsConf", description: "Conference ticket", amount: 699_00, date: Date.new(2025, 8, 8), expense_type: :business, status: :approved },
  { user: employee_2, category_name: "Wellness", vendor_name: "Apollo Pharmacy", description: "Prescription reimbursement", amount: 93_10, date: Date.new(2025, 10, 18), expense_type: :personal, status: :paid, paid_at: Date.new(2025, 10, 22) },
  { user: employee_3, category_name: "Travel", vendor_name: "Marriott", description: "Hotel stay for onsite", amount: 455_60, date: Date.new(2026, 1, 16), expense_type: :business, status: :submitted }
]

expense_rows.each_with_index do |attrs, index|
  expense = company.expenses.find_or_initialize_by(
    user: attrs[:user],
    date: attrs[:date],
    description: attrs[:description]
  )
  expense.update!(
    amount: money(attrs[:amount]),
    category_name: attrs[:category_name],
    vendor_name: attrs[:vendor_name],
    expense_type: attrs[:expense_type],
    status: attrs[:status],
    paid_at: attrs[:paid_at]
  )

  next unless File.exist?(receipt_path)
  next if expense.receipts.attached?

  expense.receipts.attach(
    io: File.open(receipt_path),
    filename: "receipt-#{index + 1}.png",
    content_type: "image/png"
  )
end

puts "Expenses ready"

providers = [
  { name: "stripe", connected: false, enabled: false, accepted_payment_methods: %w[card ach] }
]

providers.each do |attrs|
  provider = company.payments_providers.find_or_initialize_by(name: attrs[:name])
  provider.update!(attrs)
end

pending_employee_invitation = Invitation.find_or_initialize_by(company:, recipient_email: "new.employee@example.com")
pending_employee_invitation.update!(
  sender: admin,
  first_name: "New",
  last_name: "Employee",
  role: :employee,
  accepted_at: nil,
  expired_at: 10.days.from_now
)

pending_client_invitation = Invitation.find_or_initialize_by(company:, recipient_email: "new.client@example.com")
pending_client_invitation.update!(
  sender: admin,
  client: clients.first,
  first_name: "New",
  last_name: "Client",
  role: :client,
  accepted_at: nil,
  expired_at: 10.days.from_now
)

puts "Invitations ready"
puts "Seed complete"
puts "Login credentials:"
puts "- vipul@saeloun.com / #{PASSWORD} (owner)"
puts "- hello@saeloun.com / #{PASSWORD} (super admin + owner)"
puts "- supriya@saeloun.com / #{PASSWORD} (admin)"
puts "- accounts@saeloun.com / #{PASSWORD} (book keeper)"
puts "- sonam@saeloun.com / #{PASSWORD} (employee)"
puts "- keshav@saeloun.com / #{PASSWORD} (employee)"
puts "- amit@saeloun.com / #{PASSWORD} (employee)"
puts "- oliver@example.com / #{PASSWORD} (client)"
puts "- maya.client@example.com / #{PASSWORD} (client)"
puts "- finance.microsoft@example.com / #{PASSWORD} (client)"
puts "- accounts.acme@example.com / #{PASSWORD} (client)"
