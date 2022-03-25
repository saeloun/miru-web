# frozen_string_literal: true

# Timesheet Entry Start
@timesheet_entry_start_date = (Date.today.beginning_of_month - 7)
@timesheet_entry_end_date = (Date.today.end_of_month + 7)

@project_1_client_1_saeloun_india.project_members.each do |project_member|
  (@timesheet_entry_start_date..@timesheet_entry_end_date).each do |date|
    TimesheetEntry.create!(user: project_member.user, project: project_member.project, duration: 60, note: "Worked on #{@project_1_client_1_saeloun_india.name}", work_date: date)
  end
end

@project_1_client_1_saeloun_us.project_members.each do |project_member|
  (@timesheet_entry_start_date..@timesheet_entry_end_date).each do |date|
    TimesheetEntry.create!(user: project_member.user, project: project_member.project, duration: 60, note: "Worked on #{@project_1_client_1_saeloun_us.name}", work_date: date)
  end
end
# Timesheet Entry End
puts "TimeSheet entries created"
