# frozen_string_literal: true

# Projects Start
common_client_saeloun_India, client_one_saeloun_India, common_client_saeloun_US, client_one_saeloun_US = Client.first(4)

projects = [
  { name: "Project_1_common_client_saeloun_India", description: "Timesheet app", billable: false },
  { name: "Project_1_Client_1_saeloun_India", description: "Timesheet app", billable: false },
  { name: "Project_1_common_client_saeloun_US", description: "Timesheet app", billable: false },
  { name: "Project_1_Client_1_saeloun_US", description: "Timesheet app", billable: false },
]

# Projects for Common Client
common_client_saeloun_India.projects.create!(projects[0])
client_one_saeloun_India.projects.create!(projects[1])
common_client_saeloun_US.projects.create!(projects[2])
client_one_saeloun_US.projects.create!(projects[3])

puts "Projects Created"
# Projects End
