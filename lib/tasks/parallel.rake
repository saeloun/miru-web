# frozen_string_literal: true

namespace :parallel do
  desc "Setup test databases for parallel testing"
  task setup: :environment do
    require "parallel_tests"
    
    # Get number of parallel processes
    processes = ENV.fetch("PARALLEL_TEST_PROCESSES", ParallelTests.determine_number_of_processes).to_i
    
    puts "Setting up #{processes} test databases for parallel testing..."
    
    # Create and migrate all test databases
    processes.times do |i|
      env_number = i == 0 ? "" : i.to_s
      
      # Set the TEST_ENV_NUMBER for this process
      ENV["TEST_ENV_NUMBER"] = env_number
      
      db_name = "miru_web_test_#{env_number}"
      
      # Drop if exists, create, and migrate
      system("RAILS_ENV=test TEST_ENV_NUMBER=#{env_number} bundle exec rails db:drop 2>/dev/null")
      system("RAILS_ENV=test TEST_ENV_NUMBER=#{env_number} bundle exec rails db:create")
      system("RAILS_ENV=test TEST_ENV_NUMBER=#{env_number} bundle exec rails db:schema:load")
      
      puts "✓ Database #{db_name} ready"
    end
    
    puts "All test databases are ready for parallel testing!"
  end
  
  desc "Run tests in parallel"
  task test: :environment do
    system("bundle exec parallel_rspec spec")
  end
  
  desc "Run non-system tests in parallel"
  task test_no_system: :environment do
    # Run all specs except system specs
    system("bundle exec parallel_rspec spec --exclude-pattern 'spec/system/**/*_spec.rb'")
  end
  
  desc "Run tests in parallel with specified number of processes"
  task :test_with_processes, [:num_processes] => :environment do |_t, args|
    num_processes = args[:num_processes] || 10
    system("bundle exec parallel_rspec -n #{num_processes} spec")
  end
  
  desc "Run tests in parallel with coverage"
  task coverage: :environment do
    ENV["COVERAGE"] = "true"
    system("bundle exec parallel_rspec spec")
  end
end