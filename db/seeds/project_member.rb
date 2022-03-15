# frozen_string_literal: true

# Projects Members Start
project_1_common_client_IN, project_1_Client_1_company_India, project_1_common_client_US, project_1_Client_1_company_US = Project.first(4)
vipul, supriya, akhil, keshav, rohit = User.first(5)

# vipul, supriya, akhil, keshav are working on project_1_Common_client_one, project_1_Common_client_two which belong to common client of Company_India and Company_US respectively
[vipul, supriya, akhil, keshav].each do |user|
  [project_1_common_client_IN, project_1_common_client_US].each do |project|
    user.project_members.create!(project_id: project.id, hourly_rate: 5000)
  end
end

# supriya, akhil, keshav, rohit are working on project_1_client_1_company_India, project_1_client_1_company_US which belong to common client of Company_India and Company_US respectively
[supriya, akhil, keshav, rohit].each do |user|
  [project_1_Client_1_company_India, project_1_Client_1_company_US].each do |project|
    user.project_members.create!(project_id: project.id, hourly_rate: 5000)
  end
end

puts "Projects Members Created"
# Projects Members end
