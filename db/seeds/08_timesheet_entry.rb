# frozen_string_literal: true

# Timesheet Entry Start
@timesheet_entry_start_date = (Date.today.beginning_of_month - 7)
@timesheet_entry_end_date = (Date.today.end_of_month + 7)

(@timesheet_entry_start_date..@timesheet_entry_end_date).each do |date|
  [@Project_1__Client_1__saeloun_India].each do |project|
    [@vipul, @supriya, @akhil, @keshav].each do |user|
      entry = { user: user, duration: 60, note: "Worked on #{project.name}", work_date: date }
      project.timesheet_entries.create!(entry)
    end
  end
end

(@timesheet_entry_start_date..@timesheet_entry_end_date).each do |date|
  [@Project_1__Client_1__saeloun_us].each do |project|
    [@supriya, @akhil, @keshav, @rohit].each do |user|
      entry = { user: user, duration: 60, note: "Worked on #{project.name}", work_date: date }
      project.timesheet_entries.create!(entry)
    end
  end
end
# Timesheet Entry End

puts "TimeSheet entries created"
