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

  it "switches shared MiruTime timers from the dashboard shell" do
    create(
      :desktop_current_timer,
      company:,
      user:,
      current_timer: {
        billable: false,
        elapsed_ms: 180_000,
        notes: "First dashboard timer",
        project_name: "First dashboard project",
        running: true,
        source: "desktop",
        started_at: 3.minutes.ago.iso8601(3),
        synced_at: Time.current.iso8601(3),
        task_name: "First dashboard timer",
        timer_deck: {
          activeTimerId: "timer-dashboard-1",
          version: 2,
          timers: [
            {
              client: "Acme",
              description: "First dashboard timer",
              elapsedTime: 180_000,
              id: "timer-dashboard-1",
              isRunning: true,
              project: "First dashboard project",
              projectId: 10,
              startTime: 3.minutes.ago.to_i * 1000
            },
            {
              client: "Globex",
              description: "Second dashboard timer",
              elapsedTime: 60_000,
              id: "timer-dashboard-2",
              isRunning: false,
              project: "Second dashboard project",
              projectId: 11,
              startTime: nil
            }
          ]
        }
      }
    )

    with_forgery_protection do
      visit "/dashboard"

      expect(page).to have_css("#react-root", wait: 10)
      expect(page).to have_css(
        "[data-testid='dashboard-timer-control']",
        text: "First dashboard project",
        wait: 10
      )

      find("[data-testid='dashboard-timer-menu']", wait: 10).click

      within("[data-testid='dashboard-timer-popover']") do
        expect(page).to have_text("Shared with MiruTime", wait: 10)
        expect(page).to have_text("First dashboard project")
        expect(page).to have_text("Second dashboard project")
        find(
          "[data-testid='dashboard-timer-option']",
          text: "Second dashboard project"
        ).click
      end

      expect(page).to have_css(
        "[data-testid='dashboard-timer-control']",
        text: "Second dashboard project",
        wait: 10
      )

      timer_deck = page.evaluate_script(
        "JSON.parse(localStorage.getItem('miru_timer_state'))"
      )

      expect(timer_deck["activeTimerId"]).to eq("timer-dashboard-2")
      expect(timer_deck["timers"].count { |timer| timer["isRunning"] }).to eq(1)
      expect(timer_deck["timers"].find { |timer| timer["id"] == "timer-dashboard-2" }).to include(
        "isRunning" => true,
        "project" => "Second dashboard project"
      )
    end
  end

  it "logs out from the dashboard shell", :skip_sign_in do
    with_forgery_protection do
      sign_in_through_ui(user)

      expect(page).to have_current_path("/dashboard").or have_current_path("/")

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
      Capybara.reset_sessions!

      visit "/dashboard"

      expect(page).to have_current_path(%r{/(user/)?sign_in|/login}, wait: 10)
    end
  end

  context "with timeframe selection" do
    it "shows year-to-date revenue trends on the dashboard" do
      with_forgery_protection do
        visit "/dashboard"

        expect(page).to have_css("#react-root", wait: 10)
        expect(page).to have_content("This Year", wait: 10)
        expect(page).to have_content(
          "Monthly revenue trend over the past year",
          wait: 10
        )
      end
    end
  end
end
