# frozen_string_literal: true

# @timesheet_entry_start_date = (Date.today.beginning_of_month - 7)
# @timesheet_entry_end_date = (Date.today.end_of_month + 7)

# @project_flipkart_com.project_members.each do |project_member|
#   (@timesheet_entry_start_date..@timesheet_entry_end_date).each do |date|
#     TimesheetEntry.create!(
#       user: project_member.user, project: project_member.project, duration: rand(1..1440),
#       note: "Worked on #{@project_flipkart_com.name}", bill_status: :unbilled, work_date: date)
#   end
# end

# @project_azure_com.project_members.each do |project_member|
#   (@timesheet_entry_start_date..@timesheet_entry_end_date).each do |date|
#     TimesheetEntry.create!(
#       user: project_member.user, project: project_member.project, duration: rand(1..1440),
#       note: "Worked on #{@project_azure_com.name}", bill_status: :unbilled, work_date: date)
#   end
# end
# Timesheet Entry End
puts "TimeSheet entries created"
