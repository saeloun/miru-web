# frozen_string_literal: true

namespace :benchmark do
  desc "Test aggregation performance"
  task aggregations: :environment do
    require 'benchmark'
    
    company = Company.first
    unless company
      puts "No company found. Please seed the database first."
      exit
    end
    
    puts "\n=== Testing Inline Aggregation Performance ==="
    puts "Company: #{company.name}"
    puts "Clients: #{company.clients.count}"
    puts "Projects: #{company.projects.count}"
    puts "Timesheet Entries: #{company.timesheet_entries.count}"
    puts "Invoices: #{company.invoices.count}"
    
    # Test 1: Client index with aggregations
    puts "\n--- Client Index with Aggregations ---"
    time = Benchmark.measure do
      clients = company.clients.kept.includes(:logo_attachment).limit(10)
      client_details = clients.map { |client| client.client_detail("week") }
      total_minutes = client_details.sum { |cd| cd[:minutes_spent] }
      overdue_outstanding = company.overdue_and_outstanding_and_draft_amount
    end
    puts "Time: #{time.real.round(3)}s"
    
    # Test 2: Project aggregations  
    puts "\n--- Project Aggregations (10 projects) ---"
    time = Benchmark.measure do
      projects = company.projects.kept.limit(10)
      projects.each do |project|
        project.total_logged_duration("week")
        project.overdue_and_outstanding_amounts
      end
    end
    puts "Time: #{time.real.round(3)}s"
    
    # Test 3: Invoice calculations
    puts "\n--- Invoice Outstanding Calculations (all invoices) ---"
    time = Benchmark.measure do
      invoices = company.invoices.kept
      status_groups = invoices.group(:status).sum(:outstanding_amount)
      outstanding_total = status_groups.values.sum
    end
    puts "Time: #{time.real.round(3)}s"
    
    # Test 4: Full client list with all aggregations
    puts "\n--- Full Client List with All Aggregations ---"
    time = Benchmark.measure do
      clients = company.clients.kept.includes(:logo_attachment, projects: :timesheet_entries)
      
      clients.map do |client|
        {
          client_detail: client.client_detail("week"),
          project_details: client.project_details("week"),
          overdue_outstanding: client.client_overdue_and_outstanding_calculation
        }
      end
    end
    puts "Time: #{time.real.round(3)}s"
    puts "Queries executed: Check log/development.log for details"
    
    puts "\n=== Benchmark Complete ==="
  end
end