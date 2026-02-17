# frozen_string_literal: true

RSpec.configure do |config|
  config.before(:each) do |example|
    unless example.file_path.include?("currency_conversion") || example.file_path.include?("multi_currency")
      allow(CurrencyConversionService).to receive(:get_exchange_rate).and_return(1.0)
      allow(CurrencyConversionService).to receive(:convert) { |amount, _from, _to, _date| amount }
    end
  end
end
