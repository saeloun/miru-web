# frozen_string_literal: true

RSpec.configure do |config|
  config.before(:suite) do
    DatabaseCleaner.allow_remote_database_url = true
    DatabaseCleaner.url_allowlist = [ENV["DATABASE_URL"]]
    DatabaseCleaner.clean_with :truncation, except: %w(ar_internal_metadata)
  end

  config.before do
    DatabaseCleaner.strategy = :transaction
  end

  config.before do
    DatabaseCleaner.start unless RSpec.current_example.metadata[:type] == :system
  end

  config.append_after do
    DatabaseCleaner.clean unless RSpec.current_example.metadata[:type] == :system
  end

  config.before(:each, type: :system) do
    DatabaseCleaner.clean_with :deletion, except: %w(ar_internal_metadata schema_migrations), pre_count: true, reset_ids: false
  end

  config.append_after(:each, type: :system) do
    Capybara.reset_sessions!
  end
end
