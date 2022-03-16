# frozen_string_literal: true

# Timesheet Entry Start
saeloun_India, saeloun_US = ["Saeloun India Pvt. Ltd", "Saeloun USA INC."].map { |company| Company.find_by(name: company) }
vipul, supriya, akhil, keshav, rohit = ["vipul@example.com", "supriya@example.com", "akhil@example.com", "keshav@example.com", "rohit@example.com"].map { |user| User.find_by(email: user) }

# Clients
common_client_saeloun_India = Client.find_by_company_id_and_name(saeloun_India.id, "common client")
client_one_saeloun_India = Client.find_by_company_id_and_name(saeloun_India, "client_one saeloun_India")
common_client_saeloun_US = Client.find_by_company_id_and_name(saeloun_US, "common client")
client_one_saeloun_US = Client.find_by_company_id_and_name(saeloun_US, "client_one saeloun_US")

# Projects
project_1_common_client_saeloun_India = Project.find_by_client_id_and_name(common_client_saeloun_India.id, "Project_1_common_client_saeloun_India")
project_1_Client_1_saeloun_India = Project.find_by_client_id_and_name(client_one_saeloun_India.id, "Project_1_Client_1_saeloun_India")
project_1_common_client_saeloun_US = Project.find_by_client_id_and_name(common_client_saeloun_US.id, "Project_1_common_client_saeloun_US")
project_1_Client_1_saeloun_US = Project.find_by_client_id_and_name(client_one_saeloun_US.id, "Project_1_Client_1_saeloun_US")

timesheet_entry_start_date = (Date.today.beginning_of_month - 7)
timesheet_entry_end_date = (Date.today.end_of_month + 7)

# Timesheet Entries
(timesheet_entry_start_date..timesheet_entry_end_date).each do |date|
  [project_1_common_client_saeloun_India, project_1_common_client_saeloun_US].each do |project|
    [vipul, supriya, akhil, keshav].each do |user|
      entry = { user: user, duration: 60, note: "Worked on #{project.name}", work_date: date }
      project.timesheet_entries.create!(entry)
    end
  end
end

# Timesheet Entries
(timesheet_entry_start_date..timesheet_entry_end_date).each do |date|
  [project_1_Client_1_saeloun_India, project_1_Client_1_saeloun_US].each do |project|
    [supriya, akhil, keshav, rohit].each do |user|
      entry = { user: user, duration: 60, note: "Worked on #{project.name}", work_date: date }
      project.timesheet_entries.create!(entry)
    end
  end
end
# Timesheet Entry End

puts "TimeSheet entries created"
