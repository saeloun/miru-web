# frozen_string_literal: true

# Projects Start
project_india = { name: "Project_1_Client_1_saeloun_India", description: "Timesheet app", billable: false }
project_us = { name: "Project_1_Client_1_saeloun_us", description: "Timesheet app", billable: false }

@project_1_client_1_saeloun_india = @client_1_saeloun_india.projects.create(project_india)
@project_1_client_1_saeloun_us = @client_1_saeloun_us.projects.create(project_us)
puts "Projects Created"
# Projects End
