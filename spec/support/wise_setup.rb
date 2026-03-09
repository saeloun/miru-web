# frozen_string_literal: true

RSpec.configure do |config|
  config.before(:each, :wise) do
    # Stub Wise environment variables for tests
    allow(ENV).to receive(:[]).and_call_original
    allow(ENV).to receive(:[]).with("WISE_API_URL").and_return("https://api.sandbox.transferwise.tech")
    allow(ENV).to receive(:[]).with("WISE_ACCESS_TOKEN").and_return("access-token-12345")
    allow(ENV).to receive(:[]).with("WISE_PROFILE_ID").and_return("16455649")
  end
end
