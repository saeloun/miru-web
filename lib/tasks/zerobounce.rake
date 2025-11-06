# frozen_string_literal: true

namespace :zerobounce do
  desc "Check Zerobounce circuit breaker status"
  task status: :environment do
    status = ZerobounceCircuitBreaker.status

    puts "\n=== Zerobounce Circuit Breaker Status ==="
    puts "State: #{status[:state].upcase}"
    puts "Failures in last 2 hours: #{status[:failures]}"

    if status[:state] == "open"
      puts "Circuit opened at: #{status[:opened_at]}"
      puts "Last failure: #{status[:last_failure][:error]}" if status[:last_failure]
      puts "\nCircuit will auto-close after 30 minutes of no validation attempts."
    end

    puts "Email validation enabled: #{ENV['ENABLE_EMAIL_VALIDATION']}"
    puts "========================================\n"
  end

  desc "Reset Zerobounce circuit breaker (close the circuit)"
  task reset: :environment do
    ZerobounceCircuitBreaker.reset!
    puts "✓ Zerobounce circuit breaker has been reset."
    puts "Validation will resume on next signup attempt."
  end

  desc "Test Zerobounce API connection"
  task :test, [:email] => :environment do |t, args|
    email = args[:email] || "test@example.com"

    puts "\nTesting Zerobounce API with email: #{email}"
    puts "Circuit breaker status: #{ZerobounceCircuitBreaker.open? ? 'OPEN' : 'CLOSED'}"

    result = ZerobounceCircuitBreaker.execute(email)

    if result[:skip]
      puts "⚠ Validation skipped: #{result[:reason]}"
    elsif result[:success]
      puts "✓ API call successful"
      puts "Response: #{result[:response].inspect}"
    else
      puts "✗ API call failed: #{result[:reason]}"
    end
  end
end
