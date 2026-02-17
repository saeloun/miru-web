# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Dashboard", type: :system, js: true do
  let(:company) { create(:company) }
  let(:user) { create(:user, current_workspace_id: company.id) }

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
        expect(page).to have_content("Company Pulse", wait: 10)
      end
    end

    it "shows workspace activity for sent invoices" do
      with_forgery_protection do
        visit "/dashboard"

        expect(page).to have_css("#react-root", wait: 10)
        expect(page).to have_content("Workspace Activity", wait: 10)
        expect(page).to have_content("Acme Corp", wait: 10)
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

  context "with activity data from invoices and payments" do
    let!(:client) { create(:client, company:, name: "Beta Inc") }
    let!(:invoice) do
      create(:invoice, company:, client:, status: :sent, amount: 2500.00,
        sent_at: 2.days.ago, invoice_number: "INV-TEST-001")
    end
    let!(:payment) do
      create(:payment, invoice:, amount: 1000.00, status: :paid)
    end

    it "shows recent activity entries" do
      with_forgery_protection do
        visit "/dashboard"

        expect(page).to have_css("#react-root", wait: 10)
        expect(page).to have_content("Workspace Activity", wait: 10)
        expect(page).to have_content("Beta Inc", wait: 10)
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
      end
    end
  end

  context "when user is an employee" do
    let(:employee) { create(:user, current_workspace_id: company.id) }

    before do
      create(:employment, company:, user: employee)
      employee.add_role :employee, company
      Warden.test_reset!
      sign_in(employee)
    end

    it "loads the dashboard for employees" do
      with_forgery_protection do
        visit "/dashboard"

        expect(page).to have_css("#react-root", wait: 10)
        expect(page).to have_content("Welcome back", wait: 10)
        expect(page).to have_content(employee.first_name, wait: 10)
      end
    end

    it "shows stats cards for employees" do
      with_forgery_protection do
        visit "/dashboard"

        expect(page).to have_css("#react-root", wait: 10)
        expect(page).to have_content("Revenue", wait: 10)
        expect(page).to have_content("Hours Tracked", wait: 10)
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
