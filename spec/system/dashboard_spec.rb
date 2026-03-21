# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Dashboard", type: :system, js: true do
  let!(:company) { create(:company) }
  let!(:user) { create(:user, current_workspace_id: company.id) }

  before do |example|
    create(:employment, company:, user:)
    user.add_role :admin, company
    sign_in(user) unless example.metadata[:skip_sign_in]
  end

  it "loads the dashboard page for admin" do
    with_forgery_protection do
      visit "/dashboard"

      expect(page).to have_css("#react-root", wait: 10)
      expect(page).to have_content("Welcome back", wait: 10)
      expect(page).to have_content(user.first_name, wait: 10)
    end
  end

  it "displays stats cards on the dashboard" do
    with_forgery_protection do
      visit "/dashboard"

      expect(page).to have_css("#react-root", wait: 10)
      expect(page).to have_content("Revenue", wait: 10)
      expect(page).to have_content("Active Projects", wait: 10)
      expect(page).to have_content("Team Size", wait: 10)
      expect(page).to have_content("Hours Tracked", wait: 10)
    end
  end

  it "displays workspace activity section" do
    with_forgery_protection do
      visit "/dashboard"

      expect(page).to have_css("#react-root", wait: 10)
      expect(page).to have_content("Workspace Activity", wait: 10)
    end
  end

  it "shows only one logout action in the dashboard shell" do
    with_forgery_protection do
      visit "/dashboard"

      expect(page).to have_css("#react-root", wait: 10)
      expect(page).to have_button("Logout", wait: 10, count: 1)
      expect(page).to have_no_button("Sign Out", wait: 10)
    end
  end

  it "logs out from the dashboard shell" do
    with_forgery_protection do
      visit "/dashboard"

      expect(page).to have_button("Logout", wait: 10)

      click_button "Logout"

      expect(page).to have_current_path(%r{/(user/)?sign_in|/login}, wait: 10)
      expect(page).to have_content("Sign in to your workspace", wait: 10)
    end
  end

  context "with revenue data from invoices" do
    let!(:client) { create(:client, company:, name: "Acme Corp") }
    let!(:project) { create(:project, client:) }
    let!(:sent_invoice) do
      create(:invoice, company:, client:, status: :sent, amount: 5000.00, amount_due: 5000.00)
    end
    let!(:paid_invoice) do
      create(:invoice, company:, client:, status: :paid, amount: 3000.00, amount_due: 0, amount_paid: 3000.00)
    end

    it "shows revenue data on the dashboard" do
      with_forgery_protection do
        visit "/dashboard"

        expect(page).to have_css("#react-root", wait: 10)
        expect(page).to have_content("Revenue", wait: 10)
        expect(page).to have_content("Revenue Momentum", wait: 10)
      end
    end
  end

  context "with time tracking data" do
    let!(:client) { create(:client, company:) }
    let!(:project) { create(:project, client:) }

    before do
      create(:project_member, user:, project:)
      create(:timesheet_entry, user:, project:, duration: 480.0, work_date: Date.current)
    end

    it "shows hours tracked on the dashboard" do
      with_forgery_protection do
        visit "/dashboard"

        expect(page).to have_css("#react-root", wait: 10)
        expect(page).to have_content("Hours Tracked", wait: 10)
      end
    end
  end

  context "when no activity data exists" do
    it "shows empty activity state" do
      with_forgery_protection do
        visit "/dashboard"

        expect(page).to have_css("#react-root", wait: 10)
        expect(page).to have_content("Workspace Activity", wait: 10)
        expect(page).to have_content("No recent activity yet", wait: 10)
        expect(page).to have_content("No recent activity", wait: 10)
        expect(page).to have_no_content("0% Currently active", wait: 10)
      end
    end
  end

  context "when user is not authenticated" do
    it "redirects to login page", :skip_sign_in do
      Warden.test_reset!

      visit "/dashboard"

      expect(page).to have_current_path(%r{/(user/)?sign_in|/login}, wait: 10)
    end
  end

  context "with timeframe selection" do
    it "shows the timeframe label on the dashboard" do
      with_forgery_protection do
        visit "/dashboard"

        expect(page).to have_css("#react-root", wait: 10)
        expect(page).to have_content("Year to date", wait: 10)
          .or have_content("Quarter to date", wait: 10)
          .or have_content("Month to date", wait: 10)
          .or have_content("Week to date", wait: 10)
      end
    end
  end
end
