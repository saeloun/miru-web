---
id: rspec
title: Testing with RSpec
---

# Testing Guide

Miru uses a comprehensive testing strategy to ensure code quality and reliability. This guide covers our testing setup, best practices, and how to run and write tests effectively.

## Testing Stack

Our testing infrastructure includes:

- **[RSpec](https://rspec.info/)**: Primary testing framework for Ruby/Rails
- **[FactoryBot](https://github.com/thoughtbot/factory_bot)**: Test data generation
- **[Capybara](https://github.com/teamcapybara/capybara)**: Integration and system testing
- **[Selenium WebDriver](https://selenium.dev/)**: Browser automation for system tests
- **[VCR](https://github.com/vcr/vcr) & [WebMock](https://github.com/bblimke/webmock)**: HTTP request stubbing
- **[Database Cleaner](https://github.com/DatabaseCleaner/database_cleaner)**: Test isolation
- **[SimpleCov](https://github.com/simplecov-ruby/simplecov)**: Code coverage reporting
- **[Shoulda Matchers](https://github.com/thoughtbot/shoulda-matchers)**: Rails-specific test matchers

## Initial Setup

### 1. Prepare Test Database

```bash
# Create test database
bin/rails db:create RAILS_ENV=test

# Run migrations
bin/rails db:migrate RAILS_ENV=test

# Verify setup
RAILS_ENV=test bin/rails db:version
```

### 2. Install System Dependencies

For system tests (browser automation):

```bash
# macOS
brew install chromedriver

# Linux
sudo apt-get install chromium-chromedriver

# Verify installation
chromedriver --version
```

## Running Tests

### Basic Test Commands

```bash
# Run all tests (excludes system tests by default for speed)
bundle exec rspec

# Include system tests
bundle exec rspec --tag ~skip_ci

# Run specific test file
bundle exec rspec spec/models/user_spec.rb

# Run specific test by line number
bundle exec rspec spec/models/user_spec.rb:42

# Run tests matching a pattern
bundle exec rspec --grep "authentication"
```

### Test Categories

#### Unit Tests
```bash
# Model tests
bundle exec rspec spec/models/

# Service tests
bundle exec rspec spec/services/

# Policy tests (Pundit authorization)
bundle exec rspec spec/policies/

# Job tests (Solid Queue)
bundle exec rspec spec/jobs/
```

#### Integration Tests
```bash
# API endpoint tests
bundle exec rspec spec/requests/

# Controller tests (if any legacy ones exist)
bundle exec rspec spec/controllers/
```

#### System Tests (End-to-End)
```bash
# Full browser tests
bundle exec rspec spec/system/

# Run in headed mode (visible browser)
HEADLESS=false bundle exec rspec spec/system/

# Run with specific browser
bundle exec rspec spec/system/ --tag chrome
```

### Performance & Debugging Options

```bash
# Fail fast (stop on first failure)
bundle exec rspec --fail-fast

# Run tests in random order
bundle exec rspec --order random

# Run tests with detailed output
bundle exec rspec --format documentation

# Profile slowest tests
bundle exec rspec --profile 10

# Run only failed tests from last run
bundle exec rspec --only-failures

# Run tests in parallel (faster)
bundle exec rspec --require parallel_tests/rspec/runner
```

## Code Coverage

### Generate Coverage Report

```bash
# Run tests with coverage
COVERAGE=true bundle exec rspec

# View HTML coverage report
# macOS
open coverage/index.html

# Linux
xdg-open coverage/index.html

# View coverage summary in terminal
cat coverage/.last_run.json
```

### Coverage Targets

We aim for:
- **Models**: 95%+ coverage
- **Services**: 90%+ coverage
- **Controllers/Requests**: 85%+ coverage
- **Overall**: 85%+ coverage

## Writing Tests

### Test Structure

We follow RSpec best practices with clear, descriptive tests:

```ruby
# spec/models/user_spec.rb
RSpec.describe User, type: :model do
  describe "validations" do
    subject { build(:user) }

    it { is_expected.to validate_presence_of(:email) }
    it { is_expected.to validate_uniqueness_of(:email).case_insensitive }
    it { is_expected.to validate_length_of(:password).is_at_least(8) }
  end

  describe "associations" do
    it { is_expected.to have_many(:timesheet_entries) }
    it { is_expected.to belong_to(:company) }
  end

  describe "#full_name" do
    let(:user) { build(:user, first_name: "John", last_name: "Doe") }

    it "returns the concatenated first and last name" do
      expect(user.full_name).to eq("John Doe")
    end

    context "when last name is missing" do
      let(:user) { build(:user, first_name: "John", last_name: nil) }

      it "returns only the first name" do
        expect(user.full_name).to eq("John")
      end
    end
  end
end
```

### Factory Examples

```ruby
# spec/factories/users.rb
FactoryBot.define do
  factory :user do
    sequence(:email) { |n| "user#{n}@example.com" }
    password { "password123" }
    first_name { "John" }
    last_name { "Doe" }
    association :company

    trait :admin do
      role { :admin }
    end

    trait :with_timesheet_entries do
      after(:create) do |user|
        create_list(:timesheet_entry, 3, user: user)
      end
    end

    factory :admin_user, traits: [:admin]
  end
end
```

### Service Test Example

```ruby
# spec/services/invoice_generator_service_spec.rb
RSpec.describe InvoiceGeneratorService do
  describe "#process" do
    let(:company) { create(:company) }
    let(:client) { create(:client, company: company) }
    let(:project) { create(:project, client: client) }
    let!(:timesheet_entries) do
      create_list(:timesheet_entry, 3, 
        project: project, 
        duration: 2.hours, 
        work_date: 1.week.ago
      )
    end
    
    let(:service) { described_class.new(project.id, Date.current) }

    it "creates an invoice with correct total amount" do
      expect { service.process }.to change(Invoice, :count).by(1)
      
      invoice = Invoice.last
      expect(invoice.amount).to eq(6 * project.hourly_rate) # 6 hours total
      expect(invoice.client).to eq(client)
    end

    it "marks timesheet entries as invoiced" do
      service.process
      
      timesheet_entries.each(&:reload)
      expect(timesheet_entries).to all(be_invoiced)
    end

    context "when no unbilled timesheet entries exist" do
      before { timesheet_entries.update_all(invoiced: true) }

      it "raises an error" do
        expect { service.process }.to raise_error(
          InvoiceGeneratorService::NoUnbilledEntriesError
        )
      end
    end
  end
end
```

### Request Test Example

```ruby
# spec/requests/api/v1/users_spec.rb
RSpec.describe "API::V1::Users", type: :request do
  let(:company) { create(:company) }
  let(:user) { create(:user, company: company) }
  let(:headers) do
    { 
      "Authorization" => "Bearer #{generate_jwt_token(user)}",
      "Content-Type" => "application/json"
    }
  end

  describe "GET /api/v1/users" do
    let!(:users) { create_list(:user, 3, company: company) }

    it "returns all users for the company" do
      get "/api/v1/users", headers: headers

      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)
      expect(json["users"]).to have(4) # 3 created + 1 authenticated user
    end

    it "includes user details in response" do
      get "/api/v1/users", headers: headers

      json = JSON.parse(response.body)
      user_data = json["users"].first
      
      expect(user_data).to include(
        "id",
        "email", 
        "full_name",
        "role"
      )
      expect(user_data).not_to include("password_digest")
    end
  end

  describe "POST /api/v1/users" do
    let(:valid_attributes) do
      {
        user: {
          email: "newuser@example.com",
          first_name: "Jane",
          last_name: "Smith",
          password: "password123",
          role: "employee"
        }
      }
    end

    it "creates a new user" do
      expect do
        post "/api/v1/users", 
             params: valid_attributes.to_json, 
             headers: headers
      end.to change(User, :count).by(1)

      expect(response).to have_http_status(:created)
      json = JSON.parse(response.body)
      expect(json["user"]["email"]).to eq("newuser@example.com")
    end

    context "with invalid attributes" do
      let(:invalid_attributes) do
        { user: { email: "", first_name: "" } }
      end

      it "returns validation errors" do
        post "/api/v1/users", 
             params: invalid_attributes.to_json, 
             headers: headers

        expect(response).to have_http_status(:unprocessable_entity)
        json = JSON.parse(response.body)
        expect(json["errors"]).to include("email", "first_name")
      end
    end
  end
end
```

### System Test Example

```ruby
# spec/system/time_tracking_spec.rb
RSpec.describe "Time Tracking", type: :system do
  let(:company) { create(:company) }
  let(:user) { create(:user, company: company) }
  let(:client) { create(:client, company: company) }
  let(:project) { create(:project, client: client, company: company) }

  before do
    login_as(user)
    visit root_path
  end

  describe "creating a time entry" do
    it "allows user to track time for a project" do
      click_on "Start Timer"
      
      select project.name, from: "Project"
      fill_in "Description", with: "Working on homepage design"
      click_on "Start"

      expect(page).to have_content("Timer started")
      expect(page).to have_css(".timer-running", text: /00:00:\d{2}/)

      # Simulate some time passing
      sleep 2

      click_on "Stop Timer"
      
      expect(page).to have_content("Time entry saved")
      expect(TimesheetEntry.last.description).to eq("Working on homepage design")
      expect(TimesheetEntry.last.project).to eq(project)
    end

    it "validates required fields" do
      click_on "Start Timer"
      click_on "Start" # Without selecting project

      expect(page).to have_content("Project is required")
      expect(page).not_to have_css(".timer-running")
    end
  end

  describe "editing time entries" do
    let!(:time_entry) do
      create(:timesheet_entry, 
        user: user, 
        project: project,
        description: "Original description",
        duration: 2.hours
      )
    end

    it "allows editing existing entries" do
      visit timesheet_entries_path
      
      within "#time-entry-#{time_entry.id}" do
        click_on "Edit"
      end

      fill_in "Description", with: "Updated description"
      fill_in "Duration", with: "3.5"
      click_on "Update Time Entry"

      expect(page).to have_content("Time entry updated")
      expect(page).to have_content("Updated description")
      expect(page).to have_content("3.5 hours")
    end
  end

  # Test with JavaScript interactions
  describe "timer functionality", js: true do
    it "updates timer display in real-time" do
      click_on "Start Timer"
      select project.name, from: "Project"
      fill_in "Description", with: "Testing timer"
      click_on "Start"

      # Wait for timer to update
      expect(page).to have_css(".timer-display", text: /00:00:0[1-9]/, wait: 3)
    end
  end
end
```

## Test Helpers and Support

### Authentication Helper

```ruby
# spec/support/auth_helper.rb
module AuthHelper
  def login_as(user)
    # For system tests
    if respond_to?(:visit)
      visit new_user_session_path
      fill_in "Email", with: user.email
      fill_in "Password", with: user.password || "password123"
      click_on "Sign In"
    end
  end

  def generate_jwt_token(user)
    # For API tests
    JsonWebToken.encode(user_id: user.id)
  end
end

RSpec.configure do |config|
  config.include AuthHelper
end
```

### Database Cleaner Configuration

```ruby
# spec/support/database_cleaner.rb
RSpec.configure do |config|
  config.before(:suite) do
    DatabaseCleaner.clean_with(:truncation)
  end

  config.before(:each) do
    DatabaseCleaner.strategy = :transaction
  end

  config.before(:each, :js => true) do
    DatabaseCleaner.strategy = :truncation
  end

  config.before(:each) do
    DatabaseCleaner.start
  end

  config.after(:each) do
    DatabaseCleaner.clean
  end
end
```

## Continuous Integration

### GitHub Actions Configuration

Our CI pipeline runs:

```yaml
# .github/workflows/test.yml (excerpt)
- name: Run RSpec
  run: |
    bundle exec rspec --format progress \
                     --format RspecJunitFormatter \
                     --out tmp/rspec.xml

- name: Upload coverage to Codecov
  uses: codecov/codecov-action@v3
  with:
    file: ./coverage/coverage.xml
```

### Test Categories in CI

- **Fast Tests**: Models, services, policies (< 30 seconds)
- **Integration Tests**: Requests, features (< 2 minutes)
- **System Tests**: Full browser tests (< 5 minutes)
- **Linting**: Rubocop, ESLint, type checking

## Best Practices

### 1. Test Organization
```ruby
# Use descriptive test names
describe "#calculate_total_hours" do
  context "when entries span multiple days" do
    it "sums hours correctly across all entries" do
      # Test implementation
    end
  end
end
```

### 2. Data Setup
```ruby
# Use factories for object creation
let(:user) { create(:user) }

# Use build for objects that don't need persistence
let(:unsaved_user) { build(:user) }

# Use let! when you need the object created immediately
let!(:existing_entry) { create(:timesheet_entry, user: user) }
```

### 3. Mocking External Services
```ruby
# Mock external API calls
before do
  allow(StripeService).to receive(:create_invoice)
    .and_return(double(id: "inv_123", status: "open"))
end
```

### 4. Testing Edge Cases
```ruby
# Test boundary conditions
context "when duration is exactly 24 hours" do
  it "handles full day entries correctly" do
    entry = create(:timesheet_entry, duration: 24.hours)
    expect(entry.full_day?).to be_truthy
  end
end
```

## Troubleshooting Tests

### Common Issues

#### Database State Issues
```bash
# Reset test database if tests are interfering
RAILS_ENV=test bin/rails db:drop db:create db:migrate

# Clear test database
bundle exec rake db:test:prepare
```

#### System Test Issues
```bash
# Install missing browser dependencies
# macOS
brew install --cask google-chrome

# Linux
sudo apt-get install google-chrome-stable

# Update chromedriver
brew upgrade chromedriver
```

#### Flaky Tests
```bash
# Run flaky test multiple times to confirm
bundle exec rspec spec/system/flaky_spec.rb --count 10

# Run with seed to reproduce failures
bundle exec rspec --seed 12345
```

### Performance Issues
```bash
# Profile slow tests
bundle exec rspec --profile

# Check for N+1 queries
gem install bullet # Add to Gemfile in test group
```

## Useful Commands

```bash
# Generate test coverage badge
COVERAGE=true bundle exec rspec
badge coverage/coverage.svg

# Run specific test types
bundle exec rspec --tag type:model
bundle exec rspec --tag type:request
bundle exec rspec --tag type:system

# Run tests by tag
bundle exec rspec --tag focus
bundle exec rspec --tag ~slow

# Generate test documentation
bundle exec rspec --format html --out tmp/rspec.html
```

## Contributing Test Guidelines

When contributing tests:

1. **Write tests for all new features**: Aim for >85% coverage
2. **Test edge cases**: Not just the happy path
3. **Use descriptive test names**: Make intent clear
4. **Keep tests fast**: Mock external dependencies
5. **Follow existing patterns**: Maintain consistency
6. **Update tests when refactoring**: Keep them in sync with code

---

For more information on testing best practices, see:
- [RSpec Documentation](https://rspec.info/)
- [Better Specs](https://www.betterspecs.org/)
- [Rails Testing Guide](https://guides.rubyonrails.org/testing.html)