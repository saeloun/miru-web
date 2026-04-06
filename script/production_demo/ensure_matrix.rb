# frozen_string_literal: true

password = ENV.fetch("DEMO_MATRIX_PASSWORD", "password")
company = Company.find_by(name: "Saeloun Inc") || Company.first

raise "No company found" unless company

user_specs = [
  { email: "vipul@saeloun.com", first_name: "Vipul", last_name: "Demo", role: :owner, client_user: false },
  { email: "accounts@saeloun.com", first_name: "Accounts", last_name: "Demo", role: :book_keeper, client_user: false },
  { email: "keshav@saeloun.com", first_name: "Keshav", last_name: "Demo", role: :employee, client_user: false },
  { email: "finance@example.com", first_name: "Finance", last_name: "Client", role: :client, client_user: true }
]

demo_client = Client.find_or_initialize_by(company:, email: "finance@example.com")
demo_client.name = "Finance Demo Client"
demo_client.phone ||= "+15555550123"
demo_client.currency ||= company.base_currency || "USD"
demo_client.save!

demo_project = Project.find_or_initialize_by(client: demo_client, name: "Finance Demo Project")
demo_project.description = "Production demo invoice flow"
demo_project.billable = true
demo_project.save!

results = []

user_specs.each do |spec|
  user = User.find_or_initialize_by(email: spec[:email])
  user.first_name = spec[:first_name]
  user.last_name = spec[:last_name]
  user.password = password
  user.password_confirmation = password
  user.confirmed_at ||= Time.current if user.respond_to?(:confirmed_at)
  user.current_workspace = company if user.respond_to?(:current_workspace=)
  user.current_workspace_id = company.id if user.has_attribute?(:current_workspace_id)
  user.personal_email_id ||= spec[:email]
  user.date_of_birth ||= Date.new(1995, 1, 1) if user.has_attribute?(:date_of_birth)
  user.phone ||= "+15555550100" if user.has_attribute?(:phone)
  user.save!

  user.remove_roles_for(company)
  user.add_role(spec[:role], company)

  unless spec[:client_user]
    employment = Employment.find_or_initialize_by(company:, user:)
    employment.employee_id ||= "DEMO#{user.id}".slice(0, 10)
    employment.designation ||= spec[:role].to_s.humanize
    employment.employment_type ||= "Salaried"
    employment.joined_at ||= Date.current - 180
    employment.save!
  end

  if spec[:client_user]
    client_member = ClientMember.find_or_initialize_by(company:, client: demo_client, user:)
    client_member.save!
  else
    project_member = ProjectMember.find_or_initialize_by(project: demo_project, user:)
    project_member.hourly_rate = 125
    project_member.save!
  end

  results << { email: user.email, id: user.id, role: spec[:role], client_user: spec[:client_user] }
end

employee = User.find_by!(email: "keshav@saeloun.com")

3.times do |index|
  entry = TimesheetEntry.find_or_initialize_by(
    user: employee,
    project: demo_project,
    work_date: Date.current.beginning_of_week + index
  )
  entry.duration = 120
  entry.note = "Demo billable work #{index + 1}"
  entry.bill_status = :unbilled
  entry.save!
end

puts(
  {
    company_id: company.id,
    company_name: company.name,
    password:,
    demo_client_id: demo_client.id,
    demo_client_email: demo_client.email,
    demo_project_id: demo_project.id,
    unbilled_entries: TimesheetEntry.where(user: employee, project: demo_project, bill_status: :unbilled).count,
    users: results
  }.to_json
)
