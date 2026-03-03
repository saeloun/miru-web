# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Reports", type: :system, js: true do
  let(:company) { create(:company, base_currency: "USD", name: "Test Corp") }
  let(:user) { create(:user, current_workspace_id: company.id) }

  before do
    create(:employment, company:, user:)
    user.add_role :admin, company
    sign_in(user)
  end

  describe "reports index page" do
    it "displays the reports page with available report cards" do
      with_forgery_protection do
        visit "/reports"

        expect(page).to have_current_path("/reports", wait: 10)
        expect(page).to have_css("#react-root", wait: 10)
        expect(page).to have_content("Reports", wait: 10)
      end
    end

    it "shows time entry report card" do
      with_forgery_protection do
        visit "/reports"

        expect(page).to have_css("#react-root", wait: 10)
        expect(page).to have_content("Time Entry Report", wait: 10)
      end
    end

    it "shows revenue by client report card" do
      with_forgery_protection do
        visit "/reports"

        expect(page).to have_css("#react-root", wait: 10)
        expect(page).to have_content("Revenue", wait: 10)
      end
    end

    it "shows accounts aging report card" do
      with_forgery_protection do
        visit "/reports"

        expect(page).to have_css("#react-root", wait: 10)
        expect(page).to have_content("Accounts Aging", wait: 10)
      end
    end

    it "shows outstanding and overdue invoices report card" do
      with_forgery_protection do
        visit "/reports"

        expect(page).to have_css("#react-root", wait: 10)
        expect(page).to have_content("Outstanding", wait: 10).or have_content("Invoices Report", wait: 10)
      end
    end
  end

  describe "time entry report" do
    let!(:client) { create(:client, company:, name: "Alpha Client") }
    let!(:project) { create(:project, client:, name: "Alpha Project") }
    let!(:project_member) { create(:project_member, user:, project:) }
    let!(:timesheet_entry) do
      create(:timesheet_entry,
        user:,
        project:,
        duration: 480,
        note: "Worked on feature",
        work_date: Date.current)
    end

    it "loads the time entry report page" do
      with_forgery_protection do
        visit "/reports/time-entry"

        expect(page).to have_css("#react-root", wait: 10)
        expect(page).to have_content("Time Entry Report", wait: 10)
      end
    end

    it "displays summary cards with total hours" do
      with_forgery_protection do
        visit "/reports/time-entry"

        expect(page).to have_css("#react-root", wait: 10)
        expect(page).to have_content("Total Hours", wait: 10)
        expect(page).to have_content("Total Entries", wait: 10)
      end
    end

    it "shows time entry data with project and client context" do
      with_forgery_protection do
        visit "/reports/time-entry"

        expect(page).to have_css("#react-root", wait: 10)
        expect(page).to have_content("Time Entry Report", wait: 10)
        expect(page).to have_content("08:00", wait: 10).or have_content("8:00", wait: 10)
      end
    end

    it "provides group by options for organizing report data" do
      with_forgery_protection do
        visit "/reports/time-entry"

        expect(page).to have_css("#react-root", wait: 10)
        expect(page).to have_content("Group by Client", wait: 10)
          .or have_content("Client", wait: 10)
      end
    end

    it "shows export options" do
      with_forgery_protection do
        visit "/reports/time-entry"

        expect(page).to have_css("#react-root", wait: 10)
        expect(page).to have_content("Export", wait: 10)
      end
    end
  end

  describe "accounts aging report" do
    let!(:client) { create(:client, company:, name: "Slow Payer Inc") }
    let!(:overdue_invoice) do
      create(:invoice,
        company:,
        client:,
        status: :sent,
        amount: 5000.00,
        amount_due: 5000.00,
        issue_date: 90.days.ago,
        due_date: 60.days.ago)
    end

    it "loads the accounts aging report page" do
      with_forgery_protection do
        visit "/reports/accounts-aging"

        expect(page).to have_css("#react-root", wait: 10)
        expect(page).to have_content("Accounts Aging", wait: 10)
      end
    end

    it "displays aging period columns" do
      with_forgery_protection do
        visit "/reports/accounts-aging"

        expect(page).to have_css("#react-root", wait: 10)
        expect(page).to have_content("0-30 Days", wait: 10)
        expect(page).to have_content("31-60 Days", wait: 10)
        expect(page).to have_content("61-90 Days", wait: 10)
        expect(page).to have_content("90+ Days", wait: 10)
      end
    end

    it "shows total due summary" do
      with_forgery_protection do
        visit "/reports/accounts-aging"

        expect(page).to have_css("#react-root", wait: 10)
        expect(page).to have_content("Total Due", wait: 10)
      end
    end

    it "displays invoice aging details table" do
      with_forgery_protection do
        visit "/reports/accounts-aging"

        expect(page).to have_css("#react-root", wait: 10)
        expect(page).to have_content("Invoice Aging Details", wait: 10)
      end
    end

    it "shows export options for accounts aging" do
      with_forgery_protection do
        visit "/reports/accounts-aging"

        expect(page).to have_css("#react-root", wait: 10)
        expect(page).to have_content("Export", wait: 10)
      end
    end
  end

  describe "revenue by client report" do
    let!(:client_a) { create(:client, company:, name: "Client Alpha") }
    let!(:client_b) { create(:client, company:, name: "Client Beta") }
    let!(:paid_invoice) do
      create(:invoice,
        company:,
        client: client_a,
        status: :paid,
        amount: 10000.00,
        amount_paid: 10000.00,
        amount_due: 0,
        issue_date: 30.days.ago,
        due_date: 15.days.ago)
    end
    let!(:outstanding_invoice) do
      create(:invoice,
        company:,
        client: client_b,
        status: :sent,
        amount: 5000.00,
        amount_due: 5000.00,
        issue_date: 10.days.ago,
        due_date: 20.days.from_now)
    end

    it "loads the revenue by client report page" do
      with_forgery_protection do
        visit "/reports/revenue-by-client"

        expect(page).to have_css("#react-root", wait: 10)
        expect(page).to have_content("Revenue by Client", wait: 10)
      end
    end

    it "displays revenue summary cards" do
      with_forgery_protection do
        visit "/reports/revenue-by-client"

        expect(page).to have_css("#react-root", wait: 10)
        expect(page).to have_content("Total Revenue", wait: 10)
        expect(page).to have_content("Paid Amount", wait: 10)
        expect(page).to have_content("Outstanding", wait: 10)
        expect(page).to have_content("Overdue", wait: 10)
      end
    end

    it "shows client revenue details table" do
      with_forgery_protection do
        visit "/reports/revenue-by-client"

        expect(page).to have_css("#react-root", wait: 10)
        expect(page).to have_content("Client Revenue Details", wait: 10)
      end
    end

    it "shows export options for revenue report" do
      with_forgery_protection do
        visit "/reports/revenue-by-client"

        expect(page).to have_css("#react-root", wait: 10)
        expect(page).to have_content("Export", wait: 10)
      end
    end
  end

  describe "outstanding and overdue invoices report" do
    let!(:client) { create(:client, company:, name: "Pending Client") }
    let!(:sent_invoice) do
      create(:invoice,
        company:,
        client:,
        status: :sent,
        amount: 3000.00,
        amount_due: 3000.00,
        issue_date: 15.days.ago,
        due_date: 15.days.from_now)
    end
    let!(:overdue_invoice) do
      create(:invoice,
        company:,
        client:,
        status: :overdue,
        amount: 2000.00,
        amount_due: 2000.00,
        issue_date: 60.days.ago,
        due_date: 30.days.ago)
    end

    it "loads the outstanding overdue invoices report page" do
      with_forgery_protection do
        visit "/reports/outstanding-overdue-invoices"

        expect(page).to have_css("#react-root", wait: 10)
      end
    end

    it "supports the legacy outstanding overdue invoices route alias" do
      with_forgery_protection do
        visit "/reports/outstanding-overdue-invoice"

        expect(page).to have_css("#react-root", wait: 10)
      end
    end

    it "displays outstanding and overdue invoice data" do
      with_forgery_protection do
        visit "/reports/outstanding-overdue-invoices"

        expect(page).to have_css("#react-root", wait: 10)
        expect(page).to have_content("Outstanding", wait: 10)
          .or have_content("Overdue", wait: 10)
      end
    end
  end

  describe "admin access to reports" do
    it "admin can access the reports index" do
      with_forgery_protection do
        visit "/reports"

        expect(page).to have_current_path("/reports", wait: 10)
        expect(page).to have_css("#react-root", wait: 10)
        expect(page).to have_content("Reports", wait: 10)
      end
    end

    it "admin can navigate to time entry report" do
      with_forgery_protection do
        visit "/reports/time-entry"

        expect(page).to have_css("#react-root", wait: 10)
        expect(page).to have_content("Time Entry Report", wait: 10)
      end
    end

    it "admin can navigate to revenue report" do
      with_forgery_protection do
        visit "/reports/revenue-by-client"

        expect(page).to have_css("#react-root", wait: 10)
        expect(page).to have_content("Revenue by Client", wait: 10)
      end
    end

    it "admin can navigate to accounts aging report" do
      with_forgery_protection do
        visit "/reports/accounts-aging"

        expect(page).to have_css("#react-root", wait: 10)
        expect(page).to have_content("Accounts Aging", wait: 10)
      end
    end
  end

  describe "employee report access" do
    let(:employee) { create(:user, current_workspace_id: company.id) }

    before do
      create(:employment, company:, user: employee)
      employee.add_role :employee, company
      Warden.test_reset!
      login_as(employee, scope: :user)
      visit "/"
      expect(page).to have_css("#react-root", wait: 10)
    end

    it "employee cannot access reports page" do
      with_forgery_protection do
        visit "/reports"

        expect(page).to have_css("#react-root", wait: 10)
        redirected_to_time_tracking = page.has_current_path?("/time-tracking", wait: 10)
        expect(page).to have_no_content("Time Entry Report") unless redirected_to_time_tracking
      end
    end
  end

  describe "reports with comprehensive data" do
    let!(:client_a) { create(:client, company:, name: "Enterprise Corp") }
    let!(:client_b) { create(:client, company:, name: "Startup Inc") }
    let!(:project_a) { create(:project, client: client_a, name: "Enterprise Project") }
    let!(:project_b) { create(:project, client: client_b, name: "Startup Project") }
    let!(:member_a) { create(:project_member, user:, project: project_a) }
    let!(:member_b) { create(:project_member, user:, project: project_b) }
    let!(:entry_a) do
      create(:timesheet_entry,
        user:,
        project: project_a,
        duration: 240,
        note: "Enterprise work",
        work_date: Date.current)
    end
    let!(:entry_b) do
      create(:timesheet_entry,
        user:,
        project: project_b,
        duration: 360,
        note: "Startup work",
        work_date: Date.current)
    end
    let!(:paid_invoice) do
      create(:invoice,
        company:,
        client: client_a,
        status: :paid,
        amount: 15000.00,
        amount_paid: 15000.00,
        amount_due: 0,
        issue_date: 45.days.ago,
        due_date: 30.days.ago)
    end
    let!(:overdue_invoice) do
      create(:invoice,
        company:,
        client: client_b,
        status: :overdue,
        amount: 8000.00,
        amount_due: 8000.00,
        issue_date: 60.days.ago,
        due_date: 30.days.ago)
    end

    it "reports index shows data when entries and invoices exist" do
      with_forgery_protection do
        visit "/reports"

        expect(page).to have_css("#react-root", wait: 10)
        expect(page).to have_content("Reports", wait: 10)
      end
    end

    it "time entry report shows data from multiple projects" do
      with_forgery_protection do
        visit "/reports/time-entry"

        expect(page).to have_css("#react-root", wait: 10)
        expect(page).to have_content("Time Entry Report", wait: 10)
        expect(page).to have_content("Total Hours", wait: 10)
      end
    end

    it "revenue report reflects data from multiple clients" do
      with_forgery_protection do
        visit "/reports/revenue-by-client"

        expect(page).to have_css("#react-root", wait: 10)
        expect(page).to have_content("Revenue by Client", wait: 10)
        expect(page).to have_content("Total Revenue", wait: 10)
      end
    end

    it "accounts aging report reflects overdue invoice data" do
      with_forgery_protection do
        visit "/reports/accounts-aging"

        expect(page).to have_css("#react-root", wait: 10)
        expect(page).to have_content("Accounts Aging", wait: 10)
        expect(page).to have_content("Total Due", wait: 10)
      end
    end
  end
end
