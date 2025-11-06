# frozen_string_literal: true

# Seed common currency pairs
# These will be updated automatically by the UpdateExchangeRatesJob

puts "Creating currency pairs..."

currency_pairs = [
  # USD conversions
  { from: "USD", to: "EUR" },
  { from: "USD", to: "GBP" },
  { from: "USD", to: "JPY" },
  { from: "USD", to: "CAD" },
  { from: "USD", to: "AUD" },
  { from: "USD", to: "CHF" },
  { from: "USD", to: "INR" },

  # EUR conversions
  { from: "EUR", to: "USD" },
  { from: "EUR", to: "GBP" },
  { from: "EUR", to: "JPY" },
  { from: "EUR", to: "CHF" },

  # GBP conversions
  { from: "GBP", to: "USD" },
  { from: "GBP", to: "EUR" },

  # Add more pairs as needed for your business
]

currency_pairs.each do |pair|
  CurrencyPair.find_or_create_by!(
    from_currency: pair[:from],
    to_currency: pair[:to]
  ) do |cp|
    cp.active = true
    puts "  Created #{pair[:from]} -> #{pair[:to]}"
  end
end

puts "Currency pairs created successfully!"
puts "\nTo fetch initial rates, run:"
puts "  rails runner 'UpdateExchangeRatesJob.perform_now'"
