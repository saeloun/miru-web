# frozen_string_literal: true

class Benchmarker
  include Benchmark

  def initialize(users, projects, timesheet_entries)
    @min_user_id, @max_user_id = seed_users(users)
    @min_project_id, @max_project_id = seed_projects(projects)
    @min_timesheet_entry_id, @max_timesheet_entry_id = seed_timesheet_entries(timesheet_entries)
  end

  def benchmark(n, records_to_fetch)
    puts
    puts "Benchmarking for #{User.count} users, #{Project.count} projects and #{TimesheetEntry.count} timesheet entries..."
    puts
    puts "Collecting results for #{n} iterations by fetching #{records_to_fetch} records/iteration..."
    puts

    p_start = rand(@min_project_id..@max_project_id)
    p_end = rand(p_start..@max_project_id)
    project_ids = (p_start..p_end).to_a.slice(0, 10)

    u_start = rand(@min_user_id..@max_user_id)
    u_end = rand(u_start..@max_user_id)
    user_ids = (u_start..u_end).to_a.slice(0, 10)

    from = rand(Date.parse("2022-01-01")..Date.today)
    to = rand(from..Date.today)

    Benchmark.benchmark(CAPTION, 7, FORMAT, "es:avg", "pg:avg") do |x|
      es_exec_time = x.report("es") do
        n.times do
          TimesheetEntry.search(
            where: {
              project_id: project_ids,
              user_id: user_ids,
              work_date: from..to
            },
            includes: [:user, :project],
            limit: records_to_fetch,
          ).response
        end
      end

      pg_exec_time = x.report("pg") do
        n.times do
          TimesheetEntry.includes([:user, :project])
            .where(project_id: project_ids)
            .where(user_id: user_ids)
            .where(work_date: from..to)
            .take(records_to_fetch)
        end
      end

      [es_exec_time / n, pg_exec_time / n]
    end
  end

  private
    def seed_users(n)
      if n > 0
        puts "Seeding #{n} users..."
        users, batch_size = [], 10000
        n.times do
          if users.size == batch_size
            User.import! users
            users = []
          end

          users << User.new.tap do |u|
            u.first_name = "first"
            u.last_name = "second"
            u.email = "#{Faker::Alphanumeric.unique.alphanumeric(number: 10, min_alpha: 3, min_numeric: 3)}@foo.com"
            u.password = "password"

            u.current_workspace_id = 1
          end
        end

        User.import! users
        puts "Seeded #{n} users..."
        puts "\n"
      end

      res = ActiveRecord::Base.connection.execute("select min(id), max(id) from users")

      return res.first["min"], res.first["max"]
    end

    def seed_projects(n)
      if n > 0
        puts "Seeding #{n} projects..."

        projects, batch_size = [], 10000
        n.times do
          if projects.size == batch_size
            Project.import! projects
            projects = []
          end

          projects << Project.new.tap do |p|
            p.client_id = 1
            p.name = "name"
            p.description = "description"
            p.billable = true
          end
        end

        Project.import! projects
        puts "Seeded #{n} projects..."
        puts "\n"
      end

      res = ActiveRecord::Base.connection.execute("select min(id), max(id) from projects")

      return res.first["min"], res.first["max"]
    end

    def seed_timesheet_entries(n)
      if n > 0
        puts "Seeding #{n} timesheet entries..."

        timesheet_entries, batch_size = [], 10000
        n.times do
          if timesheet_entries.size == batch_size
            TimesheetEntry.import! timesheet_entries
            timesheet_entries = []
          end

          timesheet_entries << TimesheetEntry.new.tap do |t|
            t.user_id = rand(@min_user_id..@max_user_id)
            t.project_id = rand(@min_project_id..@max_project_id)
            t.duration = 480
            t.note = "note"
            t.work_date = Faker::Date.between(from: "2022-01-01", to: Date.today.to_s).to_s
            t.bill_status = 1
          end
        end

        TimesheetEntry.import! timesheet_entries

        # Reindex
        puts
        puts "Reindexing timesheet entries..."
        TimesheetEntry.reindex
        puts "Reindexed timesheet entries..."
        puts

        puts "Seeded #{n} timesheet entries..."
        puts "\n"
      end

      res = ActiveRecord::Base.connection.execute("select min(id), max(id) from timesheet_entries")

      return res.first["min"], res.first["max"]
    end
end

def main
  # Modify params to specify number of users, projects and timesheet entries to seed
  benchmarker = Benchmarker.new(0, 0, 0)
  benchmarker.benchmark(10000, 20)
end

if Rails.env.development?
  main
else
  puts "Use development environment for benchmarking!"
end
