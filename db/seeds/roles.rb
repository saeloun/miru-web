# frozen_string_literal: true

# Create Role Start
company = Company.first(2)
roles = [:owner, :admin, :employee]
company.each do |company|
  roles.each do |role|
    Role.create!(name: role, resource_type: Company, resource_id: company.id)
  end
end
puts "Roles Created"
# Create Role End
