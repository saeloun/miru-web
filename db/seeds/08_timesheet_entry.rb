# frozen_string_literal: true

# Timesheet Entry Start
require_relative "constant"

# Clients
common_client_saeloun_india = Client.find_by_company_id_and_name(SAELOUN_INDIA.id, "common client")
client_one_saeloun_india = Client.find_by_company_id_and_name(SAELOUN_INDIA, "client_one saeloun_India")
common_client_saeloun_us = Client.find_by_company_id_and_name(SAELOUN_US, "common client")
client_one_saeloun_us = Client.find_by_company_id_and_name(SAELOUN_US, "client_one saeloun_US")

# Projects
project_1_common_client_saeloun_india = Project.find_by_client_id_and_name(common_client_saeloun_india.id, "Project_1_common_client_saeloun_India")
project_1_Client_1_saeloun_india = Project.find_by_client_id_and_name(client_one_saeloun_india.id, "Project_1_Client_1_saeloun_India")
project_1_common_client_saeloun_us = Project.find_by_client_id_and_name(common_client_saeloun_us.id, "Project_1_common_client_saeloun_US")
project_1_Client_1_saeloun_us = Project.find_by_client_id_and_name(client_one_saeloun_us.id, "Project_1_Client_1_saeloun_US")

# Timesheet Entries
(TIMESHEET_ENTRY_START_DATE..TIMESHEET_ENTRY_END_DATE).each do |date|
  [project_1_common_client_saeloun_india, project_1_common_client_saeloun_us].each do |project|
    [VIPUL, SUPRIYA, AKHIL, KESHAV].each do |user|
      entry = { user: user, duration: 60, note: "Worked on #{project.name}", work_date: date }
      project.timesheet_entries.create!(entry)
    end
  end
end

# Timesheet Entries
(TIMESHEET_ENTRY_START_DATE..TIMESHEET_ENTRY_END_DATE).each do |date|
  [project_1_Client_1_saeloun_india, project_1_Client_1_saeloun_us].each do |project|
    [SUPRIYA, AKHIL, KESHAV, ROHIT].each do |user|
      entry = { user: user, duration: 60, note: "Worked on #{project.name}", work_date: date }
      project.timesheet_entries.create!(entry)
    end
  end
end
# Timesheet Entry End

puts "TimeSheet entries created"
