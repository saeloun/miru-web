# frozen_string_literal: true

# Timesheet Entry Start
SAELOUN_INDIA, SAELOUN_US = ["Saeloun India Pvt. Ltd", "Saeloun USA INC."].map { |company| Company.find_by(name: company) }
VIPUL, SUPRIYA, AKHIL, KESHAV, ROHIT = ["vipul@example.com", "supriya@example.com", "akhil@example.com", "keshav@example.com", "rohit@example.com"].map { |user| User.find_by(email: user) }

# Clients
common_client_saeloun_India = Client.find_by_company_id_and_name(SAELOUN_INDIA.id, "common client")
client_one_saeloun_India = Client.find_by_company_id_and_name(SAELOUN_INDIA, "client_one saeloun_India")
common_client_saeloun_US = Client.find_by_company_id_and_name(SAELOUN_US, "common client")
client_one_saeloun_US = Client.find_by_company_id_and_name(SAELOUN_US, "client_one saeloun_US")

# Projects
project_1_common_client_saeloun_India = Project.find_by_client_id_and_name(common_client_saeloun_India.id, "Project_1_common_client_saeloun_India")
project_1_Client_1_saeloun_India = Project.find_by_client_id_and_name(client_one_saeloun_India.id, "Project_1_Client_1_saeloun_India")
project_1_common_client_saeloun_US = Project.find_by_client_id_and_name(common_client_saeloun_US.id, "Project_1_common_client_saeloun_US")
project_1_Client_1_saeloun_US = Project.find_by_client_id_and_name(client_one_saeloun_US.id, "Project_1_Client_1_saeloun_US")

TIMESHEET_ENTRY_START_DATE = (Date.today.beginning_of_month - 7)
TIMESHEET_ENTRY_END_DATE = (Date.today.end_of_month + 7)

# Timesheet Entries
(TIMESHEET_ENTRY_START_DATE..TIMESHEET_ENTRY_END_DATE).each do |date|
  [project_1_common_client_saeloun_India, project_1_common_client_saeloun_US].each do |project|
    [VIPUL, SUPRIYA, AKHIL, KESHAV].each do |user|
      entry = { user: user, duration: 60, note: "Worked on #{project.name}", work_date: date }
      project.timesheet_entries.create!(entry)
    end
  end
end

# Timesheet Entries
(TIMESHEET_ENTRY_START_DATE..TIMESHEET_ENTRY_END_DATE).each do |date|
  [project_1_Client_1_saeloun_India, project_1_Client_1_saeloun_US].each do |project|
    [SUPRIYA, AKHIL, KESHAV, ROHIT].each do |user|
      entry = { user: user, duration: 60, note: "Worked on #{project.name}", work_date: date }
      project.timesheet_entries.create!(entry)
    end
  end
end
# Timesheet Entry End

puts "TimeSheet entries created"
