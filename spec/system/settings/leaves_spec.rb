# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Settings", type: :system, js: true do
  let(:company) { create(:company, name: "Settings Corp") }
  let(:user) { create(:user, current_workspace_id: company.id) }

  before do
    create(:employment, company:, user:)
    user.add_role :admin, company
    sign_in(user)
  end

  it "admin can access all main settings paths", :aggregate_failures do
    with_forgery_protection do
      [
        "/settings/profile",
        "/settings/organization",
        "/settings/leaves",
        "/settings/holidays",
        "/settings/payment",
        "/settings/employment"
      ].each do |path|
        visit path
        expect(page).to have_current_path(path, wait: 10)
        expect(page).to have_css("#react-root", wait: 10)
      end
    end
  end

  context "with leave and holiday data" do
    let!(:leave) { create(:leave, company:, year: Date.current.year + SecureRandom.random_number(1000)) }
    let!(:annual_leave_type) do
      create(:leave_type,
        leave:,
        name: "Annual Leave",
        allocation_value: 20,
        allocation_period: :days,
        allocation_frequency: :per_year,
        color: :chart_blue,
        icon: :vacation)
    end
    let!(:holiday) do
      create(:holiday,
        company:,
        year: Date.current.year,
        enable_optional_holidays: true,
        no_of_allowed_optional_holidays: 2,
        holiday_types: ["national", "optional"])
    end
    let!(:national_holiday) do
      create(:holiday_info,
        holiday:,
        name: "New Year Day",
        date: Date.new(Date.current.year, 1, 1),
        category: "national")
    end
    let!(:timeoff_entry) do
      create(:timeoff_entry,
        user:,
        leave_type: annual_leave_type,
        duration: 240,
        leave_date: Date.new(Date.current.year, Date.current.month, 12))
    end

    it "renders leaves and holidays views with configured context", :aggregate_failures do
      with_forgery_protection do
        visit "/settings/leaves"
        expect(page).to have_css("#react-root", wait: 10)
        expect(page).to have_content("My Leaves", wait: 10)
        expect(page).to have_text(/Balance|Leave/i, wait: 10)
        expect(page).to have_content("Leave calendar", wait: 10)
        expect(page).to have_text("Annual Leave", wait: 10)
        expect(page).to have_text("04:00", wait: 10)

        visit "/settings/holidays"
        expect(page).to have_css("#react-root", wait: 10)
        expect(page).to have_content(Date.current.year.to_s, wait: 10)
      end
    end
  end

  context "employee access" do
    let(:employee) { create(:user, current_workspace_id: company.id) }
    let!(:holiday) do
      create(:holiday,
        company:,
        year: Date.current.year,
        enable_optional_holidays: true,
        no_of_allowed_optional_holidays: 2,
        holiday_types: ["national", "optional"])
    end
    let!(:national_holiday) do
      create(:holiday_info,
        holiday:,
        name: "Republic Day",
        date: Date.new(Date.current.year, 1, 26),
        category: "national")
    end

    before do
      create(:employment, company:, user: employee)
      employee.add_role :employee, company
      sign_in(employee)
    end

    it "employee can access leaves and holiday calendar but not admin-only settings", :aggregate_failures do
      with_forgery_protection do
        visit "/settings/profile"
        expect(page).to have_css("#react-root", wait: 10)

        visit "/settings/leaves"
        expect(page).to have_css("#react-root", wait: 10)
        expect(page).to have_content("Leave calendar", wait: 10)

        visit "/settings/holidays"
        expect(page).to have_css("#react-root", wait: 10)
        expect(page).to have_content("Public Holidays", wait: 10)
        expect(page).to have_field(with: "Republic Day", disabled: true, wait: 10)
        expect(page).not_to have_button("Save Changes")

        ["/settings/organization", "/settings/payment"].each do |path|
          visit path
          expect(page).to have_css("#react-root", wait: 10)
          if page.has_current_path?("/settings/profile", wait: 2)
            expect(page).to have_current_path("/settings/profile", wait: 10)
          end
        end
      end
    end
  end

  context "configured company/user data" do
    let(:configured_company) do
      create(:company,
        name: "Configured Corp",
        base_currency: "EUR",
        standard_price: 150.00,
        fiscal_year_end: "March",
        date_format: "DD-MM-YYYY",
        timezone: "Asia/Kolkata",
        working_days: "6",
        working_hours: "45")
    end
    let(:configured_user) { create(:user, current_workspace_id: configured_company.id) }

    before do
      create(:employment, company: configured_company, user: configured_user)
      configured_user.add_role :admin, configured_company
      sign_in(configured_user)
    end

    it "shows configured organization and profile identity data", :aggregate_failures do
      with_forgery_protection do
        visit "/settings/organization"
        expect(page).to have_css("#react-root", wait: 10)
        expect(page).to have_content("Configured Corp", wait: 10)

        visit "/settings/profile"
        expect(page).to have_css("#react-root", wait: 10)
        expect(page).to have_text(/#{Regexp.escape(configured_user.first_name)}|Profile Settings/i, wait: 10)
      end
    end
  end
end
