# frozen_string_literal: true

RSpec.configure do |config|
  config.before(:each) do |example|
    # Stub CurrencyConversionService to avoid external API calls in tests
    # Skip stubbing for CurrencyConversionService specs to allow testing the actual implementation
    unless example.file_path.include?("currency_conversion_service_spec.rb")
      allow(CurrencyConversionService).to receive(:get_exchange_rate).and_return(1.0)
      allow(CurrencyConversionService).to receive(:convert) { |amount, _from, _to, _date| amount }
    end
  end
end
