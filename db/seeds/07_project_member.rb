# frozen_string_literal: true

# Projects Members Start
[@u5].each do |user|
  user.project_members.create(project_id: @p1.id, hourly_rate: 1000)
end

puts "Projects Members Created"
# Projects Members end
