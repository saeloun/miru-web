# frozen_string_literal: true

# Projects Start
SAELOUN_INDIA, SAELOUN_US = ["Saeloun India Pvt. Ltd", "Saeloun USA INC."].map { |company| Company.find_by(name: company) }

# Clients
common_client_saeloun_India = Client.find_by_company_id_and_name(SAELOUN_INDIA.id, "common client")
client_one_saeloun_India = Client.find_by_company_id_and_name(SAELOUN_INDIA, "client_one saeloun_India")
common_client_saeloun_US = Client.find_by_company_id_and_name(SAELOUN_US, "common client")
client_one_saeloun_US = Client.find_by_company_id_and_name(SAELOUN_US, "client_one saeloun_US")

projects = [
  { client_id: common_client_saeloun_India.id, name: "Project_1_common_client_saeloun_India", description: "Timesheet app", billable: false },
  { client_id: client_one_saeloun_India.id, name: "Project_1_Client_1_saeloun_India", description: "Timesheet app", billable: false },
  { client_id: common_client_saeloun_US.id, name: "Project_1_common_client_saeloun_US", description: "Timesheet app", billable: false },
  { client_id: client_one_saeloun_US.id, name: "Project_1_Client_1_saeloun_US", description: "Timesheet app", billable: false },
]

projects.each do |project|
  Project.create!(project)
end

puts "Projects Created"
# Projects End
