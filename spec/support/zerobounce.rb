# frozen_string_literal: true

# Stub Zerobounce API calls in tests to avoid hitting the real API
# and to ensure tests work without ENABLE_EMAIL_VALIDATION being set

RSpec.configure do |config|
  config.before do
    # Stub Zerobounce.validate to return a valid response by default
    # This prevents tests from failing when email validation is enabled
    allow(Zerobounce).to receive(:validate).and_return(
      {
        "status" => "valid",
        "sub_status" => "",
        "address" => "test@example.com"
      }
    )
  end
end
