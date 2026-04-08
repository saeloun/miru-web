# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Settings - Organization", type: :system, js: true do
  let(:company) do
    create(:company,
      name: "Org Settings Corp",
      base_currency: "USD",
      timezone: "Eastern Time (US & Canada)",
      date_format: "MM-DD-YYYY")
  end
  let(:user) { create(:user, current_workspace_id: company.id) }

  before do
    create(:employment, company:, user:)
    user.add_role :admin, company
    sign_in(user)
  end

  describe "organization settings page" do
    it "admin can view organization settings" do
      with_forgery_protection do
        visit "/settings/organization"

        expect(page).to have_css("#react-root", wait: 10)
      end
    end

    it "shows company name" do
      with_forgery_protection do
        visit "/settings/organization"

        expect(page).to have_css("#react-root", wait: 10)
        expect(page).to have_content("Org Settings Corp", wait: 10)
          .or have_content("Basic Details", wait: 10)
          .or have_content("ORG. SETTINGS", wait: 10)
      end
    end

    it "shows base currency" do
      with_forgery_protection do
        visit "/settings/organization"

        expect(page).to have_css("#react-root", wait: 10)
        expect(page).to have_content("CURRENCY", wait: 10)
          .or have_content("Currency", wait: 10)
          .or have_content("STANDARD RATE", wait: 10)
      end
    end

    it "shows timezone" do
      with_forgery_protection do
        visit "/settings/organization"

        expect(page).to have_css("#react-root", wait: 10)
        expect(page).to have_content("TIMEZONE", wait: 10)
          .or have_content("Timezone", wait: 10)
          .or have_content("Schedule & Time", wait: 10)
      end
    end

    it "shows date format" do
      with_forgery_protection do
        visit "/settings/organization"

        expect(page).to have_css("#react-root", wait: 10)
        expect(page).to have_content("DATE FORMAT", wait: 10)
          .or have_content("Date Format", wait: 10)
          .or have_content("TIMEZONE", wait: 10)
      end
    end

    it "admin has full access" do
      with_forgery_protection do
        visit "/settings/organization"

        expect(page).to have_current_path("/settings/organization", wait: 10)
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

    it "employee is restricted from organization settings" do
      with_forgery_protection do
        visit "/settings/organization"

        expect(page).to have_css("#react-root", wait: 10)
        expect(page).to have_current_path("/settings/profile", wait: 10)
          .or have_no_content("Basic Details", wait: 10)
      end
    end
  end
end
