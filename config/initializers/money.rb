# frozen_string_literal: true

Money.rounding_mode = BigDecimal::ROUND_HALF_EVEN

# Fallback manual rates (used if database is empty or API unavailable)
# These are approximate rates and should be updated periodically
# Last updated: October 2025

# Major currency pairs
Money.default_bank.add_rate("EUR", "USD", 1.08)
Money.default_bank.add_rate("USD", "EUR", 0.93)
Money.default_bank.add_rate("GBP", "USD", 1.27)
Money.default_bank.add_rate("USD", "GBP", 0.79)
Money.default_bank.add_rate("JPY", "USD", 0.0067)
Money.default_bank.add_rate("USD", "JPY", 149.25)
Money.default_bank.add_rate("CHF", "USD", 1.13)
Money.default_bank.add_rate("USD", "CHF", 0.88)
Money.default_bank.add_rate("CAD", "USD", 0.73)
Money.default_bank.add_rate("USD", "CAD", 1.37)
Money.default_bank.add_rate("AUD", "USD", 0.65)
Money.default_bank.add_rate("USD", "AUD", 1.54)
Money.default_bank.add_rate("INR", "USD", 0.012)
Money.default_bank.add_rate("USD", "INR", 83.12)

# Cross rates (EUR-based)
Money.default_bank.add_rate("EUR", "GBP", 0.86)
Money.default_bank.add_rate("GBP", "EUR", 1.16)
Money.default_bank.add_rate("EUR", "JPY", 161.19)
Money.default_bank.add_rate("JPY", "EUR", 0.0062)
Money.default_bank.add_rate("EUR", "CHF", 0.95)
Money.default_bank.add_rate("CHF", "EUR", 1.05)

# Load exchange rates from database after Rails initialization
# This runs after models are loaded
Rails.application.config.after_initialize do
  # Only load if not in assets precompilation or other non-runtime tasks
  next if defined?(Rails::Console) && !Rails.const_defined?("Server")
  next if Rails.env.test?

  # Skip during asset precompilation or when database is not available
  begin
    next unless ActiveRecord::Base.connection.table_exists?("currency_pairs")
  rescue ActiveRecord::ConnectionNotEstablished, PG::ConnectionBad
    Rails.logger.info("Skipping currency rate loading: database not available") if defined?(Rails.logger)
    next
  end

  begin
    CurrencyPair.active.each do |pair|
      if pair.rate.present?
        Money.default_bank.add_rate(pair.from_currency, pair.to_currency, pair.rate)
      end
    end
    Rails.logger.info("Loaded #{CurrencyPair.active.where.not(rate: nil).count} exchange rates from database")
  rescue StandardError => e
    Rails.logger.warn("Could not load exchange rates from database: #{e.message}")
  end
end
