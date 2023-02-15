# frozen_string_literal: true

require "spec_helper"
require "vcr"

ENV["RAILS_ENV"] ||= "test"

require File.expand_path("../config/environment", __dir__)

# Prevent database truncation if the environment is production
abort("The Rails environment is running in production mode!") if Rails.env.production?

# Add additional requires below this line. Rails is not loaded until this point!
require "devise"
require "rspec/rails"
require "support/database_cleaner"
require "capybara/rails"
require "capybara/rspec"

Capybara.server = :puma

if ENV["CI"].present?
  Capybara.register_driver :chrome_headless do |app|
    options = Selenium::WebDriver::Chrome::Options.new(args: %w[headless window-size=1400,1000])

    if ENV["HUB_URL"]
      Capybara::Selenium::Driver.new(
        app,
        browser: :remote,
        url: ENV["HUB_URL"],
        capabilities: options)
    end
  end

  Capybara.default_driver = :chrome_headless
  Capybara.javascript_driver = :chrome_headless
else
  Capybara.default_driver = :selenium_chrome
end

Dir[Rails.root.join("spec", "support", "**", "*.rb")].sort.each { |f| require f }

begin
  ActiveRecord::Migration.maintain_test_schema!
rescue ActiveRecord::PendingMigrationError => e
  puts e.to_s.strip
  exit 1
end

Shoulda::Matchers.configure do |config|
  config.integrate do |with|
    with.test_framework :rspec
    with.library :rails
  end
end

VCR.configure do |config|
  config.cassette_library_dir = "#{::Rails.root}/spec/cassettes"
  config.hook_into :webmock
  config.ignore_localhost = true
  config.configure_rspec_metadata!
  config.ignore_hosts "127.0.0.1", "localhost", "elasticsearch", "analytics-api.buildkite.com"
end

RSpec.configure do |config|
  config.fixture_path = "#{::Rails.root}/spec/fixtures"

  config.include Warden::Test::Helpers
  config.include Devise::Test::IntegrationHelpers, type: :request

  config.use_transactional_fixtures = false

  config.infer_spec_type_from_file_location!

  config.filter_rails_from_backtrace!
  config.include Devise::Test::IntegrationHelpers, type: :request
  config.include Warden::Test::Helpers
  config.include RequestHelper, type: :request
  config.include Devise::Test::ControllerHelpers, type: :controller
  config.include Capybara::DSL
  config.include Warden::Test::Helpers
  config.before do
    Faker::UniqueGenerator.clear
    OmniAuth.config.test_mode = true
  end

  config.around do |example|
    if [:system, :feature].include?(example.metadata[:type])
      VCR.turn_off!
      WebMock.enable_net_connect!
    end
    example.run
  ensure
    VCR.turn_on!
    WebMock.disable_net_connect!
  end

  config.before(:each, type: :system) do
    driven_by :chrome_headless

    Capybara.app_host = "http://#{IPSocket.getaddress(Socket.gethostname)}:3000"
    Capybara.server_host = IPSocket.getaddress(Socket.gethostname)
    Capybara.server_port = 3000
  end
end
