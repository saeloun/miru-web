# frozen_string_literal: true

RSpec.shared_context "native transactional request fixtures" do
  # Rails pins the fixture connection across the request executor's lease cleanup.
  self.use_transactional_tests = true
end

RSpec.configure do |config|
  config.include_context "native transactional request fixtures", type: :request

  config.before(:suite) do
    DatabaseCleaner.allow_remote_database_url = true
    DatabaseCleaner.url_allowlist = [ENV["DATABASE_URL"]]
    DatabaseCleaner.clean_with :truncation, except: %w(ar_internal_metadata)
  end

  config.before do
    DatabaseCleaner.strategy = :transaction
  end

  config.before do
    next if RSpec.current_example.metadata[:type] == :system ||
      (RSpec.current_example.metadata[:type] == :request && use_transactional_tests)

    DatabaseCleaner.start
  end

  config.append_after do
    next if RSpec.current_example.metadata[:type] == :system ||
      (RSpec.current_example.metadata[:type] == :request && use_transactional_tests)

    DatabaseCleaner.clean
  end

  config.before(:each, type: :system) do
    DatabaseCleaner.clean_with :deletion, except: %w(ar_internal_metadata schema_migrations), pre_count: true, reset_ids: false
  end

  config.append_after(:each, type: :system) do
    Capybara.reset_sessions!
  end
end
