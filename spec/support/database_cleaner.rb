# frozen_string_literal: true

RSpec.configure do |config|
  config.before(:suite) do
    DatabaseCleaner.allow_remote_database_url = true
    DatabaseCleaner.url_allowlist = ["postgres://postgres:postgres@database:5432/",
                                     "postgres://root:password@localhost/miru_web?encoding=utf8&pool=5&timeout=5000"]

    DatabaseCleaner.clean_with :truncation, except: %w(ar_internal_metadata)
  end

  config.before do
    DatabaseCleaner.strategy = :transaction
  end

  config.before do
    DatabaseCleaner.start
  end

  config.after do
    DatabaseCleaner.clean
  end
end
