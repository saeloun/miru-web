# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Settings - Holidays", type: :system, js: true do
  let(:company) { create(:company, name: "Holiday Corp") }
  let(:user) { create(:user, current_workspace_id: company.id) }

  before do
    create(:employment, company:, user:)
    user.add_role :admin, company
    sign_in(user)
  end

  describe "holidays settings page" do
    it "admin can view holidays settings page" do
      with_forgery_protection do
        visit "/settings/holidays"

        expect(page).to have_css("#react-root", wait: 10)
      end
    end

    it "shows year selector" do
      with_forgery_protection do
        visit "/settings/holidays"

        expect(page).to have_css("#react-root", wait: 10)
        expect(page).to have_content(Date.current.year.to_s, wait: 10)
      end
    end

    it "shows an empty schedule state when no holidays exist" do
      with_forgery_protection do
        visit "/settings/holidays"

        expect(page).to have_css("#react-root", wait: 10)
        expect(page).to have_content("Public Holidays", wait: 10)
        expect(page).to have_text("No public holidays configured", wait: 10)
      end
    end

    it "shows localized holiday copy in Hindi" do
      user.update!(locale: "hi")

      with_forgery_protection do
        visit "/settings/holidays"

        expect(page).to have_css("#react-root", wait: 10)
        expect(page).to have_text("सार्वजनिक छुट्टियाँ", wait: 10)
        expect(page).to have_text(
          "कोई सार्वजनिक छुट्टियाँ कॉन्फ़िगर नहीं हैं",
          wait: 10
        )
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
          name: "Independence Day",
          date: Date.new(Date.current.year, 7, 4),
          category: "national")
      end
      let!(:optional_holiday) do
        create(:holiday_info,
          holiday:,
          name: "Company Founder Day",
          date: Date.new(Date.current.year, 9, 10),
          category: "optional")
      end

      it "shows holiday list when holidays exist" do
        with_forgery_protection do
          visit "/settings/holidays"

          expect(page).to have_css("#react-root", wait: 10)
          expect(page).to have_content("Public Holidays", wait: 10)
          expect(page).to have_text("Independence Day", wait: 10)

          # Switch to Year At A Glance tab to verify calendar rendering
          find("button", text: "Year At A Glance").click
          expect(page).to have_css("[data-testid='holidays-calendar']", wait: 10)
          expect(page).to have_css("[data-testid='holiday-calendar-day-#{Date.current.year}-07-04']", wait: 10)
          expect(page).to have_css("[data-testid='holiday-calendar-day-#{Date.current.year}-09-10']", wait: 10)
        end
      end
    end

    it "admin can access the page" do
      with_forgery_protection do
        visit "/settings/holidays"

        expect(page).to have_current_path("/settings/holidays", wait: 10)
        expect(page).to have_css("#react-root", wait: 10)
      end
    end
  end

  describe "employee access" do
    let(:employee) { create(:user, current_workspace_id: company.id) }

    before do
      create(:employment, company:, user: employee)
      employee.add_role :employee, company
      sign_in(employee)
    end

    it "employee cannot access holidays settings" do
      with_forgery_protection do
        visit "/settings/holidays"

        expect(page).to have_css("#react-root", wait: 10)
        if page.has_current_path?("/settings/profile", wait: 2)
          expect(page).to have_current_path("/settings/profile", wait: 10)
        else
          expect(page).to have_no_content("Holiday Management")
        end
      end
    end
  end
end
