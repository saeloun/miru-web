# frozen_string_literal: true

require "yaml"
require "date"
require "set"

config_path = ENV.fetch("SUBSET_CONFIG", Rails.root.join("config/data_subsets/miru.yml").to_s)
config = YAML.safe_load_file(config_path)

target_company_id = Integer(config.fetch("target_company_id"))
start_date = Date.parse(config.fetch("start_date"))
start_year = start_date.year
keep_company_name = config.fetch("keep_company_name")
internal_domain = config.fetch("internal_email_domain")
external_domain = config.fetch("external_email_domain")

connection = ActiveRecord::Base.connection

def id_list_sql(ids)
  ids.presence&.join(",") || "NULL"
end

def quoted_date(date)
  ActiveRecord::Base.connection.quote(date.to_s)
end

def role_priority_for(user, company)
  roles = user.roles.where(resource: company).pluck(:name)
  return :owner if roles.include?("owner")
  return :admin if roles.include?("admin")
  return :book_keeper if roles.include?("book_keeper")
  return :employee if roles.include?("employee")

  :client
end

def update_known_columns(record, attributes)
  filtered_attributes = attributes.select { |key, _value| record.has_attribute?(key) }
  record.update_columns(filtered_attributes) if filtered_attributes.any?
end

company = Company.find(target_company_id)

keep_user_ids = Employment.kept.where(company_id: target_company_id).pluck(:user_id).uniq
keep_client_ids = Client.kept.where(company_id: target_company_id).pluck(:id)
keep_project_ids = Project.kept.joins(:client).where(clients: { company_id: target_company_id }).pluck(:id)
keep_invoice_ids = Invoice.kept.where(company_id: target_company_id).where("issue_date >= ?", start_date).pluck(:id)
keep_payment_ids = Payment.where(invoice_id: keep_invoice_ids).pluck(:id)
keep_invoice_timesheet_entry_ids = if connection.data_source_exists?("invoice_line_items")
  InvoiceLineItem.where(invoice_id: keep_invoice_ids).where.not(timesheet_entry_id: nil).pluck(:timesheet_entry_id).uniq
else
  []
end
keep_timesheet_entry_ids = TimesheetEntry.kept.where(project_id: keep_project_ids).where("work_date >= ?", start_date).pluck(:id)
keep_timesheet_entry_ids = (keep_timesheet_entry_ids + keep_invoice_timesheet_entry_ids).uniq
keep_user_ids = (keep_user_ids + TimesheetEntry.where(id: keep_timesheet_entry_ids).pluck(:user_id)).uniq
keep_leave_ids = Leave.kept.where(company_id: target_company_id).where("year >= ?", start_year).pluck(:id)
keep_leave_type_ids = LeaveType.kept.where(leave_id: keep_leave_ids).pluck(:id)
keep_holiday_ids = Holiday.kept.where(company_id: target_company_id).where("year >= ?", start_year).pluck(:id)
keep_holiday_info_ids = HolidayInfo.kept.where(holiday_id: keep_holiday_ids).pluck(:id)
keep_custom_leave_ids = CustomLeave.where(leave_id: keep_leave_ids).pluck(:id)
timeoff_conditions = []
timeoff_conditions << "user_id NOT IN (#{id_list_sql(keep_user_ids)})"
timeoff_conditions << "leave_date < #{quoted_date(start_date)}"
timeoff_conditions << "(leave_type_id IS NOT NULL AND leave_type_id NOT IN (#{id_list_sql(keep_leave_type_ids)}))" if connection.column_exists?(:timeoff_entries, :leave_type_id)
timeoff_conditions << "(holiday_info_id IS NOT NULL AND holiday_info_id NOT IN (#{id_list_sql(keep_holiday_info_ids)}))" if connection.column_exists?(:timeoff_entries, :holiday_info_id)
timeoff_conditions << "(custom_leave_id IS NOT NULL AND custom_leave_id NOT IN (#{id_list_sql(keep_custom_leave_ids)}))" if connection.column_exists?(:timeoff_entries, :custom_leave_id)

tables_to_truncate = %w[
  ahoy_events
  ahoy_visits
  bulk_invoice_download_statuses
  notifications
  metrics
  exchange_rate_usages
  currency_pairs
  ses_invalid_emails
  solid_queue_blocked_executions
  solid_queue_claimed_executions
  solid_queue_failed_executions
  solid_queue_jobs
  solid_queue_pauses
  solid_queue_processes
  solid_queue_ready_executions
  solid_queue_recurring_executions
  solid_queue_scheduled_executions
  solid_queue_semaphores
]

tables_to_truncate.each do |table_name|
  next unless connection.data_source_exists?(table_name)

  connection.execute("TRUNCATE TABLE #{table_name} RESTART IDENTITY CASCADE")
end

if connection.data_source_exists?("active_storage_variant_records")
  connection.execute("TRUNCATE TABLE active_storage_variant_records RESTART IDENTITY CASCADE")
end
if connection.data_source_exists?("active_storage_attachments")
  connection.execute("TRUNCATE TABLE active_storage_attachments RESTART IDENTITY CASCADE")
end
if connection.data_source_exists?("active_storage_blobs")
  connection.execute("TRUNCATE TABLE active_storage_blobs RESTART IDENTITY CASCADE")
end

connection.execute("DELETE FROM invoice_line_items WHERE invoice_id NOT IN (#{id_list_sql(keep_invoice_ids)})") if connection.data_source_exists?("invoice_line_items")
connection.execute("DELETE FROM payments WHERE id NOT IN (#{id_list_sql(keep_payment_ids)})") if connection.data_source_exists?("payments")
connection.execute("DELETE FROM invoices WHERE id NOT IN (#{id_list_sql(keep_invoice_ids)})") if connection.data_source_exists?("invoices")
connection.execute("DELETE FROM timesheet_entries WHERE id NOT IN (#{id_list_sql(keep_timesheet_entry_ids)})") if connection.data_source_exists?("timesheet_entries")
connection.execute("DELETE FROM project_members WHERE project_id NOT IN (#{id_list_sql(keep_project_ids)}) OR user_id NOT IN (#{id_list_sql(keep_user_ids)})") if connection.data_source_exists?("project_members")
connection.execute("DELETE FROM projects WHERE id NOT IN (#{id_list_sql(keep_project_ids)})") if connection.data_source_exists?("projects")
connection.execute("DELETE FROM client_members WHERE client_id NOT IN (#{id_list_sql(keep_client_ids)}) OR user_id NOT IN (#{id_list_sql(keep_user_ids)})") if connection.data_source_exists?("client_members")
if connection.data_source_exists?("invitations")
  invitation_conditions = []
  invitation_conditions << "company_id <> #{target_company_id}"
  invitation_conditions << "sender_id IS NOT NULL AND sender_id NOT IN (#{id_list_sql(keep_user_ids)})" if connection.column_exists?(:invitations, :sender_id)
  invitation_conditions << "client_id IS NOT NULL AND client_id NOT IN (#{id_list_sql(keep_client_ids)})" if connection.column_exists?(:invitations, :client_id)
  connection.execute("DELETE FROM invitations WHERE #{invitation_conditions.join(' OR ')}")
end
connection.execute("DELETE FROM notification_preferences WHERE company_id <> #{target_company_id} OR user_id NOT IN (#{id_list_sql(keep_user_ids)})") if connection.data_source_exists?("notification_preferences")
connection.execute("DELETE FROM carryovers WHERE company_id <> #{target_company_id} OR user_id NOT IN (#{id_list_sql(keep_user_ids)}) OR leave_type_id NOT IN (#{id_list_sql(keep_leave_type_ids)})") if connection.data_source_exists?("carryovers")
connection.execute("DELETE FROM timeoff_entries WHERE #{timeoff_conditions.join(' OR ')}") if connection.data_source_exists?("timeoff_entries")
connection.execute("DELETE FROM custom_leave_users WHERE user_id NOT IN (#{id_list_sql(keep_user_ids)}) OR custom_leave_id NOT IN (#{id_list_sql(keep_custom_leave_ids)})") if connection.data_source_exists?("custom_leave_users")
connection.execute("DELETE FROM custom_leaves WHERE id NOT IN (#{id_list_sql(keep_custom_leave_ids)})") if connection.data_source_exists?("custom_leaves")
connection.execute("DELETE FROM leave_types WHERE id NOT IN (#{id_list_sql(keep_leave_type_ids)})") if connection.data_source_exists?("leave_types")
connection.execute("DELETE FROM holiday_infos WHERE id NOT IN (#{id_list_sql(keep_holiday_info_ids)})") if connection.data_source_exists?("holiday_infos")
connection.execute("DELETE FROM holidays WHERE id NOT IN (#{id_list_sql(keep_holiday_ids)})") if connection.data_source_exists?("holidays")
connection.execute("DELETE FROM leaves WHERE id NOT IN (#{id_list_sql(keep_leave_ids)})") if connection.data_source_exists?("leaves")
connection.execute("DELETE FROM previous_employments WHERE user_id NOT IN (#{id_list_sql(keep_user_ids)})") if connection.data_source_exists?("previous_employments")
connection.execute("DELETE FROM devices WHERE company_id <> #{target_company_id} OR user_id NOT IN (#{id_list_sql(keep_user_ids)})") if connection.data_source_exists?("devices")
connection.execute("DELETE FROM identities WHERE user_id NOT IN (#{id_list_sql(keep_user_ids)})") if connection.data_source_exists?("identities")
connection.execute("DELETE FROM employments WHERE company_id <> #{target_company_id} OR user_id NOT IN (#{id_list_sql(keep_user_ids)})") if connection.data_source_exists?("employments")
connection.execute("DELETE FROM addresses WHERE (addressable_type = 'Company' AND addressable_id <> #{target_company_id}) OR (addressable_type = 'User' AND addressable_id NOT IN (#{id_list_sql(keep_user_ids)})) OR (addressable_type = 'Client' AND addressable_id NOT IN (#{id_list_sql(keep_client_ids)}))") if connection.data_source_exists?("addresses")
connection.execute("DELETE FROM payments_providers WHERE company_id <> #{target_company_id}") if connection.data_source_exists?("payments_providers")
connection.execute("DELETE FROM stripe_connected_accounts WHERE company_id <> #{target_company_id}") if connection.data_source_exists?("stripe_connected_accounts")
connection.execute("DELETE FROM wise_accounts WHERE company_id <> #{target_company_id}") if connection.data_source_exists?("wise_accounts")
connection.execute("DELETE FROM expenses") if connection.data_source_exists?("expenses")
connection.execute("DELETE FROM vendors WHERE company_id <> #{target_company_id}") if connection.data_source_exists?("vendors")
connection.execute("DELETE FROM expense_categories WHERE company_id <> #{target_company_id}") if connection.data_source_exists?("expense_categories")
connection.execute("DELETE FROM clients WHERE id NOT IN (#{id_list_sql(keep_client_ids)})") if connection.data_source_exists?("clients")
connection.execute("DELETE FROM users_roles WHERE user_id NOT IN (#{id_list_sql(keep_user_ids)})") if connection.data_source_exists?("users_roles")
connection.execute("DELETE FROM users WHERE id NOT IN (#{id_list_sql(keep_user_ids)})") if connection.data_source_exists?("users")
connection.execute("UPDATE users SET current_workspace_id = #{target_company_id} WHERE current_workspace_id <> #{target_company_id}") if connection.column_exists?(:users, :current_workspace_id)
connection.execute("DELETE FROM companies WHERE id <> #{target_company_id}") if connection.data_source_exists?("companies")
connection.execute("DELETE FROM roles WHERE id NOT IN (SELECT role_id FROM users_roles)") if connection.data_source_exists?("roles")

company.reload
update_known_columns(company,
  name: keep_company_name,
  address: "475 Clermont Ave, Brooklyn, NY 11238",
  business_phone: "+19296207865",
  country: "US",
  timezone: "(GMT-10:00) America/Adak",
  bank_name: "Sample Bank",
  bank_account_number: "XXXX5678",
  bank_routing_number: "000111222",
  bank_swift_code: "SAMPLEUS33",
  tax_id: "XX-XXXXXXX",
  vat_number: "VAT-0001",
  gst_number: "GST-0001"
)

role_counters = Hash.new(0)
used_emails = Set.new

User.where(id: keep_user_ids).order(:id).find_each do |user|
  role = role_priority_for(user, company)
  role_counters[role] += 1
  existing_local = user.email.to_s.split("@").first.parameterize(separator: ".").presence
  email_base = if role == :client
    "#{existing_local || "client#{role_counters[role]}"}@#{external_domain}"
  else
    "#{existing_local || "#{role}#{role_counters[role]}"}@#{internal_domain}"
  end
  email = email_base
  if used_emails.include?(email)
    local_part, domain = email.split("@", 2)
    email = "#{local_part}.#{user.id}@#{domain}"
  end
  used_emails << email
  local = email.split("@").first
  first_name = local.split(/[._]/).first.to_s.gsub(/[^a-zA-Z]/, "").capitalize
  last_name = local.split(/[._]/)[1..].to_a.join(" ").gsub(/[^a-zA-Z]/, " ").squeeze(" ").strip
  last_name = role.to_s.humanize if last_name.blank?

  update_known_columns(user,
    first_name: first_name.presence || role.to_s.humanize,
    last_name: last_name,
    email: email,
    personal_email_id: email,
    phone: "+1555#{user.id.to_s.rjust(6, '0')}",
    social_accounts: { github_url: "", linkedin_url: "" }
  )
end

Client.order(:id).find_each.with_index(1) do |client, index|
  update_known_columns(client,
    name: ["Microsoft", "Acme Labs", "Northwind Studio", "Pinecone Health", "Summit Advisory", "Bluebird Creative"][index - 1] || "Client #{index}",
    email: "client#{index}@#{external_domain}",
    phone: "+1415555#{index.to_s.rjust(4, '0')}",
    address: nil,
    stripe_id: nil
  )
end

Address.find_each.with_index(1) do |address, index|
  update_known_columns(address,
    address_line_1: "#{100 + index} Example Street",
    address_line_2: "Suite #{index}",
    city: "Brooklyn",
    state: "NY",
    country: "US",
    pin: "11238"
  )
end

Project.order(:id).find_each.with_index(1) do |project, index|
  update_known_columns(project,
    name: project.name.presence || "Project #{index}",
    description: "Sanitized project #{index}"
  )
end

Invoice.order(:id).find_each.with_index(1) do |invoice, index|
  update_known_columns(invoice,
    invoice_number: "MIRU-#{index.to_s.rjust(4, '0')}",
    reference: "FY#{invoice.issue_date&.year || start_year}#{index.to_s.rjust(2, '0')}",
    external_view_key: SecureRandom.hex(16)
  )
end

Payment.order(:id).find_each.with_index(1) do |payment, index|
  update_known_columns(payment, name: "Payment #{index}")
end

NotificationPreference.find_each do |preference|
  update_known_columns(preference,
    notification_enabled: true,
    invoice_email_notifications: true,
    payment_email_notifications: true,
    timesheet_reminder_enabled: true,
    unsubscribed_from_all: false
  )
end

puts({
  company_id: target_company_id,
  users: User.count,
  clients: Client.count,
  projects: Project.count,
  timesheets: TimesheetEntry.count,
  invoices: Invoice.count,
  payments: Payment.count,
  expenses: Expense.count,
  leaves: Leave.count,
  leave_types: LeaveType.count,
  timeoff_entries: TimeoffEntry.count
}.inspect)
