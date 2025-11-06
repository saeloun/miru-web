# frozen_string_literal: true

RSpec.configure do |config|
  config.before(:suite) do
    DatabaseCleaner.allow_remote_database_url = true
    DatabaseCleaner.url_allowlist = [ENV["DATABASE_URL"]]

    # Disconnect all active connections to avoid deadlocks
    ActiveRecord::Base.connection_pool.disconnect!

    # Retry truncation if deadlock occurs
    retries = 3
    begin
      DatabaseCleaner.clean_with :truncation, except: %w(ar_internal_metadata)
    rescue ActiveRecord::Deadlocked => e
      retries -= 1
      if retries > 0
        Rails.logger.warn("Deadlock detected during database cleanup, retrying... (#{retries} attempts left)")
        sleep(0.5)
        retry
      else
        raise e
      end
    end

    # Reconnect after cleanup
    ActiveRecord::Base.establish_connection
  end

  config.before do
    DatabaseCleaner.strategy = :transaction
  end

  config.before(:each, type: :system) do
    # Driver is probably for an external browser with an app
    # under test that does *not* share a database connection with the
    # specs, so use truncation strategy.
    DatabaseCleaner.strategy = :truncation
  end

  config.before do
    DatabaseCleaner.start
  end

  config.append_after do
    DatabaseCleaner.clean
  end
end
