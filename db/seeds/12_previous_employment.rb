# frozen_string_literal: true

# Previous Employment Start
previous_employment =
  {
    company_name: "XYZ",
    role: "SDE"
  }

# Create Previous Employment for Users
@users.each { | user | user.previous_employments.create!(previous_employment) }

puts "Previous Employment Created"
# Previous Employment End
