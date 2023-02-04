# frozen_string_literal: true

# Employment Start
@users.each { |user| @saeloun_us.employments.create!(user:) }
puts "Employment Created"
# Employment End
