# frozen_string_literal: true

# Timesheet Entry Start
project_1_Common_client_one, project_1_Common_client_two, project_1_Client_1_Company_India, project_1_Client_1_Company_US = Project.first(4)
vipul, supriya, akhil, keshav, rohit = User.first(5)

((Date.today.beginning_of_month - 7)..(Date.today.end_of_month + 7)).each do |date|
  [project_1_Common_client_one, project_1_Common_client_two].each do |project|
    [vipul, supriya, akhil, keshav].each do |user|
      entry = { user: user, duration: 60, note: "Worked on #{project}", work_date: date }
      project.timesheet_entries.create!(entry)
    end
  end
end

((Date.today.beginning_of_month - 7)..(Date.today.end_of_month + 7)).each do |date|
  [project_1_Client_1_Company_India, project_1_Client_1_Company_US].each do |project|
    [supriya, akhil, keshav, rohit].each do |user|
      entry = { user: user, duration: 60, note: "Worked on #{project}", work_date: date }
      project.timesheet_entries.create!(entry)
    end
  end
end
# Timesheet Entry End

puts "TimeSheet entries created"
