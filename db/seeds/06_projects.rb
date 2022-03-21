# frozen_string_literal: true

# Projects Start

projects = [
  { client_id: @client_1__saeloun_India.id, name: "Project_1__Client_1__saeloun_India", description: "Timesheet app", billable: false },
  { client_id: @client_1__saeloun_us.id, name: "Project_1__Client_1__saeloun_us", description: "Timesheet app", billable: false },
]
projects.each { |project| Project.create!(project) }
puts "Projects Created"

@Project_1__Client_1__saeloun_India = Project.find_by_client_id_and_name(@client_1__saeloun_India.id, "Project_1__Client_1__saeloun_India")
@Project_1__Client_1__saeloun_us = Project.find_by_client_id_and_name(@client_1__saeloun_us.id, "Project_1__Client_1__saeloun_us")
# Projects End
