# frozen_string_literal: true

# Projects Members Start

# vipul, supriya, akhil, keshav are working on @Project_1__Client_1__saeloun_India
[@vipul, @supriya, @akhil, @keshav].each do |user|
  [@Project_1__Client_1__saeloun_India].each do |project|
    user.project_members.create!(project_id: project.id, hourly_rate: 5000)
  end
end

# supriya, akhil, keshav, rohit are working on @Project_1__Client_1__saeloun_us
[@supriya, @akhil, @keshav, @rohit].each do |user|
  [@Project_1__Client_1__saeloun_us].each do |project|
    user.project_members.create!(project_id: project.id, hourly_rate: 5000)
  end
end

puts "Projects Members Created"
# Projects Members end
