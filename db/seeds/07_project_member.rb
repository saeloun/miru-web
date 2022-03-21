# frozen_string_literal: true

# Projects Members Start
# vipul, supriya, akhil, keshav are working on @project_1_Client_1_saeloun_india
[@vipul, @supriya, @akhil, @keshav].each do |user|
  user.project_members.create(project_id: @project_1_Client_1_saeloun_india.id, hourly_rate: 5000)
end

# supriya, akhil, keshav, rohit are working on @project_1_Client_1_saeloun_us
[@supriya, @akhil, @keshav, @rohit].each do |user|
  user.project_members.create(project_id: @project_1_Client_1_saeloun_us.id, hourly_rate: 5000)
end
puts "Projects Members Created"
# Projects Members end
