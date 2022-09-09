# frozen_string_literal: true

desc "Setup the project by running migrations and seed data"
task setup: [:environment, "db:drop", "db:create", "db:migrate", "db:seed"] do
  puts "Completed the database setup with sample data"
end
