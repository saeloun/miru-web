
require 'csv'

namespace :import do
  desc 'Seed data from CSV file'
  task seed_data_from_csv: :environment do
    csv_file = 'lib/csvs/time-entries.csv'

    unless Rails.env.production?
      CSV.foreach(csv_file, headers: true) do |row|
        project = row['Project']
        client_name = row['Client']
        full_name = row['Team Member']
        date_str = row['Date']
        hours_logged = row['Hours Logged']
        hours,minutes = hours_logged.split(":")
        duration = hours.to_i * 60 + minutes.to_i
        note = row['Note']

        company = Company.find_by!(name: "Saeloun Inc")
        first_name, last_name = full_name.split(' ', 2)
        email = "#{first_name.downcase}test@saeloun.com"
        password = "Welcome@123"

        user = User.find_by(email: email)
        if user.nil?
          user = User.create!(
            first_name: first_name,
            last_name: last_name,
            email: email,
            password: password,
            password_confirmation: password,
            confirmed_at: Time.current,
            current_workspace_id: company.id
          )
          user.add_role(:employee, company)
          puts 'User created'
        end
        employment = Employment.find_by(user: user, company: company)

        if employment.nil?
          company.employments.create!(user: user)
          puts 'Employment created'
        end
        client = Client.find_or_create_by(name: client_name, company_id: company.id, email: "hr@client.com")
        project = Project.find_or_create_by(name: project, client_id: client.id, billable: true)
        project_member = ProjectMember.find_by(user_id: user.id, project_id: project.id)
        if project_member.nil?
          user.project_members.create(project_id: project.id, hourly_rate: rand(40..150))
        end
        puts 'project members created'
        date = DateTime.strptime(date_str, '%m.%d.%Y').to_date

        timesheet_entry = TimesheetEntry.create!(
          project_id: project.id,
          user_id: user.id,
          work_date: date,
          note: note,
          bill_status: "unbilled",
          duration: duration
        )
        timesheet_entry.save
      end
      puts 'Seed data import complete.'
    end
  end
end
