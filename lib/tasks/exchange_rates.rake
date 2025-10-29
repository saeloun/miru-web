# frozen_string_literal: true

namespace :exchange_rates do
  desc "Setup exchange rates system"
  task setup: :environment do
    puts "Setting up Exchange Rates system..."
    puts ""

    # Check for API key
    if ENV['OPEN_EXCHANGE_RATES_APP_ID'].blank?
      puts "⚠️  WARNING: OPEN_EXCHANGE_RATES_APP_ID not set!"
      puts "   Add it to your .env file:"
      puts "   OPEN_EXCHANGE_RATES_APP_ID=your_app_id_here"
      puts ""
    end

    # Seed currency pairs
    puts "Creating currency pairs..."
    load Rails.root.join('db', 'seeds', 'currency_pairs.rb')
    puts ""

    # Fetch initial rates
    if ENV['OPEN_EXCHANGE_RATES_APP_ID'].present?
      puts "Fetching initial exchange rates..."
      UpdateExchangeRatesJob.perform_now
      puts ""
    end

    puts "✅ Setup complete!"
    puts ""
    puts "Next steps:"
    puts "1. Verify currency pairs: rails exchange_rates:list"
    puts "2. Check usage: rails exchange_rates:usage"
    puts "3. Restart your application"
  end

  desc "List all configured currency pairs"
  task list: :environment do
    pairs = CurrencyPair.active.order(:from_currency, :to_currency)

    if pairs.empty?
      puts "No currency pairs configured. Run: rails exchange_rates:setup"
    else
      puts "Active Currency Pairs:"
      puts ""
      puts "From → To     | Rate          | Last Updated"
      puts "-" * 60

      pairs.each do |pair|
        rate = pair.rate ? format("%.6f", pair.rate) : "Not fetched"
        updated = pair.last_updated_at ? pair.last_updated_at.strftime("%Y-%m-%d %H:%M") : "Never"
        puts "#{pair.from_currency.ljust(3)} → #{pair.to_currency.ljust(3)}    | #{rate.ljust(13)} | #{updated}"
      end

      puts ""
      puts "Total: #{pairs.count} pairs"
    end
  end

  desc "Show current API usage"
  task usage: :environment do
    usage = ExchangeRateUsage.current

    puts "Exchange Rate API Usage"
    puts "=" * 50
    puts "Month:            #{usage.month.strftime('%B %Y')}"
    puts "Requests Used:    #{usage.requests_count} / #{ExchangeRateUsage::FREE_TIER_LIMIT}"
    puts "Percentage:       #{usage.usage_percentage}%"
    puts "Remaining:        #{usage.remaining_requests}"
    puts "Last Fetched:     #{usage.last_fetched_at&.strftime('%Y-%m-%d %H:%M:%S') || 'Never'}"
    puts ""

    if usage.limit_exceeded?
      puts "⚠️  LIMIT EXCEEDED - No more requests this month"
    elsif usage.approaching_limit?
      puts "⚠️  WARNING - Approaching monthly limit"
    else
      puts "✅ Usage is within normal range"
    end
  end

  desc "Fetch exchange rates now"
  task fetch: :environment do
    puts "Fetching exchange rates..."
    result = ExchangeRates::FetchService.new.process

    if result[:success]
      puts "✅ Success!"
      puts "   Your currency pairs updated: #{result[:rates_updated]}"
      if result[:total_currencies_available]
        puts "   (API provides #{result[:total_currencies_available]} currencies total)"
      end
      puts "   API Usage: #{result[:usage]}%"
    else
      puts "❌ Failed: #{result[:error]}"
    end
  end

  desc "Add a new currency pair"
  task :add, [:from, :to] => :environment do |_t, args|
    if args[:from].blank? || args[:to].blank?
      puts "Usage: rails exchange_rates:add[USD,EUR]"
      exit 1
    end

    pair = CurrencyPair.create(
      from_currency: args[:from].upcase,
      to_currency: args[:to].upcase,
      active: true
    )

    if pair.persisted?
      puts "✅ Added #{args[:from].upcase} → #{args[:to].upcase}"
      puts "   Run 'rails exchange_rates:fetch' to get the rate"
    else
      puts "❌ Failed to add pair: #{pair.errors.full_messages.join(', ')}"
    end
  end

  desc "Test currency conversion"
  task :convert, [:amount, :from, :to] => :environment do |_t, args|
    if args[:amount].blank? || args[:from].blank? || args[:to].blank?
      puts "Usage: rails exchange_rates:convert[100,EUR,USD]"
      exit 1
    end

    amount = args[:amount].to_f
    result = CurrencyConversionService.new(
      amount: amount,
      from_currency: args[:from],
      to_currency: args[:to]
    ).process

    puts "#{amount} #{args[:from].upcase} = #{result} #{args[:to].upcase}"
  end

  desc "Discover needed currency pairs from companies and clients"
  task discover: :environment do
    puts "🔍 Discovering currency pairs from your data..."
    puts ""

    service = ExchangeRates::CurrencyPairDiscoveryService.new
    result = service.process

    puts "DISCOVERY RESULTS:"
    puts "=" * 60
    puts "Total Pairs Found:    #{result[:total_pairs]}"
    puts "Pairs Activated:      #{result[:activated]}"
    puts "Pairs Deactivated:    #{result[:deactivated]}"
    puts ""

    if result[:discovered_pairs].any?
      puts "DISCOVERED CURRENCY PAIRS:"
      puts "-" * 60
      result[:discovered_pairs].sort.each do |from, to|
        puts "  #{from} → #{to}"
      end
      puts ""
      puts "✅ Currency pairs have been synced to the database"
      puts "   Run 'rails exchange_rates:fetch' to get rates"
    else
      puts "⚠️  No currency pairs discovered"
      puts "   This might mean:"
      puts "   - All companies and clients use the same currency"
      puts "   - No clients have been created yet"
      puts "   - No invoices have been created yet"
    end
  end

  desc "Check exchange rate system health"
  task health: :environment do
    puts "🏥 Exchange Rate System Health Check"
    puts "=" * 60
    puts ""

    service = ExchangeRates::HealthCheckService.new
    result = service.check

    # Status indicator
    case result[:status]
    when :healthy
      puts "✅ Status: HEALTHY"
    when :warning
      puts "⚠️  Status: WARNING"
    when :critical
      puts "❌ Status: CRITICAL"
    end
    puts ""

    # Details
    puts "SYSTEM DETAILS:"
    puts "-" * 60
    puts "API Key Configured:       #{result[:details][:api_key_configured] ? '✅ Yes' : '❌ No'}"
    puts "Active Currency Pairs:    #{result[:details][:database_rates_count]}"
    puts "Fallback Rates Available: #{result[:details][:fallback_rates_available]}"
    puts "API Usage:                #{result[:details][:usage_percentage]}%"
    puts "Last Rate Update:         #{result[:details][:last_update]&.strftime('%Y-%m-%d %H:%M') || 'Never'}"
    puts ""

    # Issues
    if result[:issues].any?
      puts "🚨 CRITICAL ISSUES:"
      puts "-" * 60
      result[:issues].each do |issue|
        puts "  ❌ #{issue}"
      end
      puts ""
    end

    # Warnings
    if result[:warnings].any?
      puts "⚠️  WARNINGS:"
      puts "-" * 60
      result[:warnings].each do |warning|
        puts "  ⚠️  #{warning}"
      end
      puts ""
    end

    # Recommendations
    if !result[:healthy]
      puts "💡 RECOMMENDATIONS:"
      puts "-" * 60
      if !result[:details][:api_key_configured]
        puts "  1. Set OPEN_EXCHANGE_RATES_APP_ID in your .env file"
        puts "     Get a free API key at: https://openexchangerates.org/signup/free"
      end
      if result[:details][:database_rates_count].zero?
        puts "  2. Run: rails exchange_rates:discover"
        puts "  3. Run: rails exchange_rates:fetch"
      end
      if result[:details][:last_update].nil? || result[:details][:last_update] < 2.days.ago
        puts "  4. Verify scheduled job is running (should run daily at 1 AM EST)"
      end
      puts ""
    end

    # Summary
    if result[:healthy]
      puts "✅ System is healthy and operating normally"
    else
      puts "⚠️  System has issues but will continue operating with fallback rates"
    end
  end

  desc "Show currency usage analysis"
  task analyze: :environment do
    puts "📊 Currency Usage Analysis"
    puts "=" * 60
    puts ""

    # Companies by base currency
    puts "COMPANIES BY BASE CURRENCY:"
    Company.group(:base_currency).count.each do |currency, count|
      puts "  #{currency}: #{count} #{'company'.pluralize(count)}"
    end
    puts ""

    # Clients by currency
    puts "CLIENTS BY CURRENCY:"
    Client.kept.group(:currency).count.sort_by { |_, count| -count }.each do |currency, count|
      puts "  #{currency}: #{count} #{'client'.pluralize(count)}"
    end
    puts ""

    # Recent invoices by currency
    puts "RECENT INVOICES (Last 6 months) BY CURRENCY:"
    Invoice.kept.where("created_at >= ?", 6.months.ago)
      .group(:currency).count.sort_by { |_, count| -count }.each do |currency, count|
      puts "  #{currency}: #{count} #{'invoice'.pluralize(count)}"
    end
    puts ""

    # Currency pairs needed
    puts "CURRENCY PAIRS NEEDED:"
    service = ExchangeRates::CurrencyPairDiscoveryService.new
    result = service.process

    if result[:discovered_pairs].any?
      result[:discovered_pairs].sort.each do |from, to|
        pair = CurrencyPair.find_by(from_currency: from, to_currency: to)
        status = pair&.active? ? "✅ Active" : "❌ Inactive"
        rate = pair&.rate ? format("%.4f", pair.rate) : "No rate"
        puts "  #{from} → #{to}: #{status} (#{rate})"
      end
    else
      puts "  No currency pairs needed (all same currency)"
    end
  end
end
