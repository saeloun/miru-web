# frozen_string_literal: true

# Seed file for comprehensive timesheet test data
# Run with: rails db:seed:timesheet_data

puts "🕐 Creating timesheet test data..."

# Find or create a test company
company = Company.find_or_create_by!(name: "Test Company") do |c|
  c.business_phone = "555-0100"
end

# Create address for company if it doesn't have one
unless company.address
  address = Address.create!(
    address_line_1: "123 Test Street",
    city: "Test City",
    state: "CA",
    country: "US",
    pin: "12345",
    addressable_type: "Company",
    addressable_id: company.id
  )
  company.update!(address: address)
end

# Create multiple users with different roles
users = []

# Special users requested
vipul = User.find_or_create_by!(email: "vipul@example.com") do |u|
  u.first_name = "Vipul"
  u.last_name = "Amler"
  u.password = "Password123!"
  u.password_confirmation = "Password123!"
  u.confirmed_at = Time.current
  u.current_workspace_id = company.id
end
Employment.find_or_create_by!(user: vipul, company: company) do |e|
  e.designation = "Senior Developer"
  e.employment_type = "full_time"
  e.joined_at = 2.years.ago
end
vipul.add_role(:admin, company) unless vipul.has_role?(:admin, company)
users << vipul

hello_user = User.find_or_create_by!(email: "hello@example.com") do |u|
  u.first_name = "Hello"
  u.last_name = "User"
  u.password = "Password123!"
  u.password_confirmation = "Password123!"
  u.confirmed_at = Time.current
  u.current_workspace_id = company.id
end
Employment.find_or_create_by!(user: hello_user, company: company) do |e|
  e.designation = "Product Manager"
  e.employment_type = "full_time"
  e.joined_at = 1.year.ago
end
hello_user.add_role(:admin, company) unless hello_user.has_role?(:admin, company)
users << hello_user

# Admin user
admin = User.find_or_create_by!(email: "admin@example.com") do |u|
  u.first_name = "Admin"
  u.last_name = "User"
  u.password = "Password123!"
  u.password_confirmation = "Password123!"
  u.confirmed_at = Time.current
  u.current_workspace_id = company.id
end
Employment.find_or_create_by!(user: admin, company: company) do |e|
  e.designation = "Admin"
  e.employment_type = "full_time"
  e.joined_at = 1.year.ago
end
admin.add_role(:admin, company) unless admin.has_role?(:admin, company)
users << admin

# Regular employees
5.times do |i|
  user = User.find_or_create_by!(email: "employee#{i + 1}@example.com") do |u|
    u.first_name = "Employee"
    u.last_name = "#{i + 1}"
    u.password = "Password123!"
    u.password_confirmation = "Password123!"
    u.confirmed_at = Time.current
    u.current_workspace_id = company.id
  end

  Employment.find_or_create_by!(user: user, company: company) do |e|
    e.designation = ["Developer", "Designer", "Manager", "QA Engineer", "DevOps"].sample
    e.employment_type = ["full_time", "part_time", "contract"].sample
    e.joined_at = rand(6..24).months.ago
  end

  user.add_role(:employee, company) unless user.has_role?(:employee, company)
  users << user
end

# Create clients
clients = []
["Acme Corp", "TechStart Inc", "Global Solutions", "Digital Agency", "StartupXYZ"].each do |client_name|
  client = Client.find_or_create_by!(name: client_name, company: company) do |c|
    c.email = "contact@#{client_name.downcase.delete(' ')}.com"
    c.phone = "555-#{rand(1000..9999)}"
  end

  unless client.address
    address = Address.create!(
      address_line_1: "#{rand(100..999)} Business Ave",
      city: ["New York", "San Francisco", "Austin", "Seattle", "Boston"].sample,
      state: ["NY", "CA", "TX", "WA", "MA"].sample,
      country: "US",
      pin: rand(10000..99999).to_s,
      addressable_type: "Client",
      addressable_id: client.id
    )
  end

  clients << client
end

# Create projects for each client
projects = []
clients.each do |client|
  rand(1..3).times do |i|
    project_type = ["Web Development", "Mobile App", "Consulting", "Design", "Maintenance"].sample
    project = Project.find_or_create_by!(
      name: "#{client.name} - #{project_type} #{i + 1}",
      client: client
    ) do |p|
      p.description = "#{project_type} project for #{client.name}"
      p.billable = [true, false].sample
      p.total_hours = rand(100..1000)
    end
    projects << project

    # Assign users to projects
    users.sample(rand(2..4)).each do |user|
      ProjectMember.find_or_create_by!(project: project, user: user) do |pm|
        pm.hourly_rate = rand(50..200)
        pm.joined_at = project.created_at
      end
    end
  end
end

puts "📊 Creating timesheet entries for the last 3 months..."

# Generate timesheet entries for the last 3 months
users.each do |user|
  # Get projects this user is assigned to
  user_projects = Project.joins(:project_members).where(project_members: { user_id: user.id })

  next if user_projects.empty?

  # Generate entries for the last 90 days
  (0..90).each do |days_ago|
    date = Date.current - days_ago.days

    # Skip weekends for most users (but not all, for variety)
    next if date.saturday? || date.sunday? unless rand < 0.1

    # Generate 0-3 entries per day
    rand(0..3).times do
      project = user_projects.sample

      # Vary the duration - typical workday entries
      duration = case rand(1..10)
                 when 1..2 then 30  # 30 min task
                 when 3..4 then 60  # 1 hour task
                 when 5..6 then 90  # 1.5 hour task
                 when 7..8 then 120 # 2 hour task
                 when 9 then 180    # 3 hour task
                 else 240           # 4 hour task
      end

      # Add some randomness
      duration += [-15, 0, 15, 30].sample
      duration = [duration, 15].max # Minimum 15 minutes

      TimesheetEntry.find_or_create_by!(
        user: user,
        project: project,
        work_date: date
      ) do |entry|
        entry.duration = duration
        entry.note = [
          "Worked on feature implementation",
          "Bug fixes and testing",
          "Code review and refactoring",
          "Client meeting and discussion",
          "Documentation updates",
          "Sprint planning",
          "Performance optimization",
          "UI/UX improvements",
          "Database migration",
          "API development",
          "Deployment and monitoring",
          "Research and investigation"
        ].sample
        entry.bill_status = project.billable ? ["unbilled", "billed"].sample : "non_billable"
      end
    end
  end
end

# Create some leave/time-off entries
puts "🏖️  Creating leave entries..."

users.each do |user|
  # Add some vacation days
  rand(0..5).times do
    leave_date = Date.current - rand(1..90).days

    LeaveType.find_or_create_by!(
      name: ["Vacation", "Sick Leave", "Personal Day", "Holiday"].sample,
      company: company
    ) do |lt|
      lt.color = ["#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4"].sample
      lt.icon = ["🏖️", "🏥", "👤", "🎉"].sample
    end

    leave_type = company.leave_types.sample

    if leave_type
      # Skip creating leave if it would conflict with existing entries
      begin
        Leave.find_or_create_by!(
          user: user,
          leave_type: leave_type,
          leave_date: leave_date
        ) do |leave|
          leave.duration = [4, 8].sample # Half day or full day
          leave.note = "Time off - #{leave_type.name}"
        end
      rescue ActiveRecord::RecordInvalid
        # Skip if leave already exists for this date
      end
    end
  end
end

# Generate weekly summary
puts "📈 Generating summary statistics..."

# Calculate statistics for current week
current_week_start = Date.current.beginning_of_week
current_week_end = Date.current.end_of_week

users.each do |user|
  total_hours = TimesheetEntry
    .where(user: user, work_date: current_week_start..current_week_end)
    .sum(:duration) / 60.0

  puts "  #{user.first_name} #{user.last_name}: #{total_hours.round(2)} hours this week"
end

# Project statistics
projects.each do |project|
  total_hours = TimesheetEntry
    .where(project: project, work_date: 1.month.ago..Date.current)
    .sum(:duration) / 60.0

  puts "  #{project.name}: #{total_hours.round(2)} hours last month"
end

puts "✅ Timesheet test data created successfully!"
puts "   - #{company.users.count} users"
puts "   - #{company.clients.count} clients"
puts "   - #{Project.count} projects"
puts "   - #{TimesheetEntry.count} timesheet entries"
puts "   - #{Leave.count} leave entries"
puts ""
puts "Test accounts:"
puts "  Admin: admin@example.com / Password123!"
puts "  Employees: employee1@example.com to employee5@example.com / Password123!"
