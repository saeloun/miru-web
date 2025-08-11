# frozen_string_literal: true

# Temporarily skip all system specs for CI
RSpec.configure do |config|
  config.before(:each, type: :system) do
    skip "System specs temporarily disabled for CI migration"
  end
end
