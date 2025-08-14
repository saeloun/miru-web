# frozen_string_literal: true

# Stub Grover PDF generation in tests to avoid Chrome dependency
RSpec.configure do |config|
  config.before(:each) do
    # Stub Grover to return a simple PDF string
    allow_any_instance_of(Grover).to receive(:to_pdf).and_return("PDF content stub")
  end
end
