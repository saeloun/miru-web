# frozen_string_literal: true

# Projects Members Start
# vipul, supriya, akhil, keshav are working on @project_1_Client_1_saeloun_india
[@vipul, @supriya, @akhil, @keshav].each do |user|
  user.project_members.create(project_id: @project_flipkart_com.id, hourly_rate: 1000)
  user.project_members.create(project_id: @project_phonepe_com.id, hourly_rate: 2000)
  user.project_members.create(project_id: @client_one_us_project_alpha.id, hourly_rate: 3000)
end

# supriya, akhil, keshav, rohit are working on @project_1_Client_1_saeloun_us
[@supriya, @akhil, @keshav, @rohit].each do |user|
  user.project_members.create(project_id: @project_office_com.id, hourly_rate: 5000)
  user.project_members.create(project_id: @project_azure_com.id, hourly_rate: 5000)
  user.project_members.create(project_id: @client_two_us_project_delta.id, hourly_rate: 5000)
end

puts "Projects Members Created"
# Projects Members end
