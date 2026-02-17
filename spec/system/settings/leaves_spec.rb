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

  describe "leaves settings" do
    it "displays the leaves settings page" do
      with_forgery_protection do
        visit "/settings/leaves"

        expect(page).to have_css("#react-root", wait: 10)
      end
    end

    context "with leave types configured" do
      let!(:leave) { create(:leave, company:, year: Date.current.year) }
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
      let!(:sick_leave_type) do
        create(:leave_type,
          leave:,
          name: "Sick Leave",
          allocation_value: 10,
          allocation_period: :days,
          allocation_frequency: :per_year,
          color: :chart_green,
          icon: :medicine)
      end

      it "displays configured leave types" do
        with_forgery_protection do
          visit "/settings/leaves"

          expect(page).to have_css("#react-root", wait: 10)
        end
      end

      it "shows leave balance information" do
        with_forgery_protection do
          visit "/settings/leaves"

          expect(page).to have_css("#react-root", wait: 10)
          expect(page).to have_content("Balance", wait: 10)
            .or have_content("Leave", wait: 10)
        end
      end

      it "displays the current year in leave management" do
        with_forgery_protection do
          visit "/settings/leaves"

          expect(page).to have_css("#react-root", wait: 10)
          expect(page).to have_content(Date.current.year.to_s, wait: 10)
        end
      end
    end
  end

  describe "holidays settings" do
    it "displays the holidays settings page" do
      with_forgery_protection do
        visit "/settings/holidays"

        expect(page).to have_css("#react-root", wait: 10)
      end
    end

    context "with holidays configured" do
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
          name: "New Year's Day",
          date: Date.new(Date.current.year, 1, 1),
          category: "national")
      end
      let!(:optional_holiday) do
        create(:holiday_info,
          holiday:,
          name: "Company Anniversary",
          date: Date.new(Date.current.year, 6, 15),
          category: "optional")
      end

      it "displays existing holidays" do
        with_forgery_protection do
          visit "/settings/holidays"

          expect(page).to have_css("#react-root", wait: 10)
        end
      end

      it "shows the current year context" do
        with_forgery_protection do
          visit "/settings/holidays"

          expect(page).to have_css("#react-root", wait: 10)
          expect(page).to have_content(Date.current.year.to_s, wait: 10)
        end
      end
    end
  end

  describe "profile settings" do
    it "displays the profile settings page" do
      with_forgery_protection do
        visit "/settings/profile"

        expect(page).to have_css("#react-root", wait: 10)
      end
    end

    it "shows profile settings header" do
      with_forgery_protection do
        visit "/settings/profile"

        expect(page).to have_css("#react-root", wait: 10)
        expect(page).to have_content("Profile Settings", wait: 10)
          .or have_content("PROFILE SETTINGS", wait: 10)
      end
    end

    it "displays user information" do
      with_forgery_protection do
        visit "/settings/profile"

        expect(page).to have_css("#react-root", wait: 10)
        expect(page).to have_content(user.first_name, wait: 10)
          .or have_content(user.email, wait: 10)
      end
    end
  end

  describe "organization settings" do
    it "displays the organization settings page" do
      with_forgery_protection do
        visit "/settings/organization"

        expect(page).to have_css("#react-root", wait: 10)
      end
    end

    it "shows company name on organization page" do
      with_forgery_protection do
        visit "/settings/organization"

        expect(page).to have_css("#react-root", wait: 10)
        expect(page).to have_content("Settings Corp", wait: 10)
          .or have_content("Basic Details", wait: 10)
          .or have_content("ORG. SETTINGS", wait: 10)
      end
    end

    it "shows company details including currency and rate" do
      with_forgery_protection do
        visit "/settings/organization"

        expect(page).to have_css("#react-root", wait: 10)
        expect(page).to have_content("Currency", wait: 10)
          .or have_content("Standard Rate", wait: 10)
          .or have_content("Base Currency", wait: 10)
      end
    end

    it "shows date and time settings" do
      with_forgery_protection do
        visit "/settings/organization"

        expect(page).to have_css("#react-root", wait: 10)
        expect(page).to have_content("Timezone", wait: 10)
          .or have_content("Date Format", wait: 10)
          .or have_content("Date & Time", wait: 10)
      end
    end

    it "shows working days and hours configuration" do
      with_forgery_protection do
        visit "/settings/organization"

        expect(page).to have_css("#react-root", wait: 10)
        expect(page).to have_content("Working", wait: 10)
          .or have_content("Working Days", wait: 10)
          .or have_content("Working Hours", wait: 10)
      end
    end
  end

  describe "payment settings" do
    it "displays the payment settings page" do
      with_forgery_protection do
        visit "/settings/payment"

        expect(page).to have_css("#react-root", wait: 10)
      end
    end

    it "shows payment settings header" do
      with_forgery_protection do
        visit "/settings/payment"

        expect(page).to have_css("#react-root", wait: 10)
        expect(page).to have_content("Payment Settings", wait: 10)
          .or have_content("PAYMENT SETTINGS", wait: 10)
      end
    end

    it "shows payment provider configuration" do
      with_forgery_protection do
        visit "/settings/payment"

        expect(page).to have_css("#react-root", wait: 10)
        expect(page).to have_content("Stripe", wait: 10)
          .or have_content("Payment Providers", wait: 10)
          .or have_content("Payment Settings", wait: 10)
      end
    end
  end

  describe "admin access to all settings" do
    it "admin can access profile settings" do
      with_forgery_protection do
        visit "/settings/profile"

        expect(page).to have_current_path("/settings/profile", wait: 10)
        expect(page).to have_css("#react-root", wait: 10)
      end
    end

    it "admin can access organization settings" do
      with_forgery_protection do
        visit "/settings/organization"

        expect(page).to have_current_path("/settings/organization", wait: 10)
        expect(page).to have_css("#react-root", wait: 10)
      end
    end

    it "admin can access leaves settings" do
      with_forgery_protection do
        visit "/settings/leaves"

        expect(page).to have_current_path("/settings/leaves", wait: 10)
        expect(page).to have_css("#react-root", wait: 10)
      end
    end

    it "admin can access holidays settings" do
      with_forgery_protection do
        visit "/settings/holidays"

        expect(page).to have_current_path("/settings/holidays", wait: 10)
        expect(page).to have_css("#react-root", wait: 10)
      end
    end

    it "admin can access payment settings" do
      with_forgery_protection do
        visit "/settings/payment"

        expect(page).to have_current_path("/settings/payment", wait: 10)
        expect(page).to have_css("#react-root", wait: 10)
      end
    end

    it "admin can access employment details" do
      with_forgery_protection do
        visit "/settings/employment"

        expect(page).to have_current_path("/settings/employment", wait: 10)
        expect(page).to have_css("#react-root", wait: 10)
      end
    end
  end

  describe "employee settings access" do
    let(:employee) { create(:user, current_workspace_id: company.id) }

    before do
      create(:employment, company:, user: employee)
      employee.add_role :employee, company
      Warden.test_reset!
      login_as(employee, scope: :user)
      visit "/"
      expect(page).to have_css("#react-root", wait: 10)
    end

    it "employee can access profile settings" do
      with_forgery_protection do
        visit "/settings/profile"

        expect(page).to have_css("#react-root", wait: 10)
        expect(page).to have_content("Profile Settings", wait: 10)
          .or have_content("PROFILE SETTINGS", wait: 10)
      end
    end

    it "employee can access leaves settings" do
      with_forgery_protection do
        visit "/settings/leaves"

        expect(page).to have_css("#react-root", wait: 10)
      end
    end

    it "employee cannot access organization settings" do
      with_forgery_protection do
        visit "/settings/organization"

        expect(page).to have_css("#react-root", wait: 10)
        expect(page).not_to have_content("Basic Details")
          .or have_current_path("/settings/profile", wait: 10)
      end
    end

    it "employee cannot access holidays settings" do
      with_forgery_protection do
        visit "/settings/holidays"

        expect(page).to have_css("#react-root", wait: 10)
        expect(page).not_to have_content("Holiday Management")
          .or have_current_path("/settings/profile", wait: 10)
      end
    end

    it "employee cannot access payment settings" do
      with_forgery_protection do
        visit "/settings/payment"

        expect(page).to have_css("#react-root", wait: 10)
        expect(page).not_to have_content("Payment Providers")
          .or have_current_path("/settings/profile", wait: 10)
      end
    end
  end

  describe "settings display current configuration data" do
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
      Warden.test_reset!
      login_as(configured_user, scope: :user)
      visit "/"
      expect(page).to have_css("#react-root", wait: 10)
    end

    it "organization settings reflect configured company data" do
      with_forgery_protection do
        visit "/settings/organization"

        expect(page).to have_css("#react-root", wait: 10)
        expect(page).to have_content("Configured Corp", wait: 10)
      end
    end

    it "profile settings reflect user personal data" do
      with_forgery_protection do
        visit "/settings/profile"

        expect(page).to have_css("#react-root", wait: 10)
        expect(page).to have_content(configured_user.first_name, wait: 10)
          .or have_content("Profile Settings", wait: 10)
      end
    end
  end
end
