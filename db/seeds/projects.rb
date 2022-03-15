# frozen_string_literal: true

# Projects Start
common_client_IN, client_one_company_India, common_client_US, client_one_company_US = Client.first(4)

projects = [
  { name: "Project_1_common_client_IN", description: "Timesheet app", billable: false },
  { name: "Project_1_Client_1_company_India", description: "Timesheet app", billable: false },
  { name: "Project_1_common_client_US", description: "Timesheet app", billable: false },
  { name: "Project_1_Client_1_company_US", description: "Timesheet app", billable: false },
]

# Projects for Common Client
common_client_IN.projects.create!(projects[0])
client_one_company_India.projects.create!(projects[1])
common_client_US.projects.create!(projects[2])
client_one_company_US.projects.create!(projects[3])

puts "Projects Created"
# Projects End
