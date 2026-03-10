# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Reports", type: :system, js: true do
  let!(:company) { create(:company, base_currency: "USD", name: "Reports Corp") }
  let!(:admin) { create(:user, current_workspace_id: company.id) }

  before do
    create(:employment, company:, user: admin)
    admin.add_role :admin, company
    sign_in(admin)
  end

  def expect_reports_shell(title = "Reports")
    expect(page).to have_css("#react-root", wait: 10)
    expect(page).to have_content(title, wait: 10)
  end

  it "loads the reports index with the main report cards" do
    with_forgery_protection do
      visit "/reports"

      expect_reports_shell
      expect(page).to have_content("Time Entry Report", wait: 10)
      expect(page).to have_content("Revenue", wait: 10)
      expect(page).to have_content("Accounts Aging", wait: 10)
      expect(page).to have_content("Outstanding", wait: 10)
    end
  end

  it "loads the time entry report" do
    client = create(:client, company:, name: "Alpha Client")
    project = create(:project, client:, name: "Alpha Project")
    create(:project_member, user: admin, project:)
    create(:timesheet_entry, user: admin, project:, duration: 480, work_date: Date.current)

    with_forgery_protection do
      visit "/reports/time-entry"

      expect_reports_shell("Time Entry Report")
      expect(page).to have_content("Total Hours", wait: 10)
      expect(page).to have_content("Export", wait: 10)
    end
  end

  it "loads the revenue by client report" do
    client = create(:client, company:, name: "Client Alpha")
    create(:invoice, company:, client:, status: :paid, amount: 1000, amount_paid: 1000, amount_due: 0)

    with_forgery_protection do
      visit "/reports/revenue-by-client"

      expect_reports_shell("Revenue by Client")
      expect(page).to have_content("Total Revenue", wait: 10)
    end
  end

  it "loads the accounts aging report" do
    client = create(:client, company:, name: "Slow Payer")
    create(:invoice, company:, client:, status: :sent, amount: 5000, amount_due: 5000, issue_date: 90.days.ago, due_date: 60.days.ago)

    with_forgery_protection do
      visit "/reports/accounts-aging"

      expect_reports_shell("Accounts Aging")
      expect(page).to have_content("Total Due", wait: 10)
    end
  end

  it "loads the outstanding and overdue invoices report" do
    client = create(:client, company:, name: "Pending Client")
    create(:invoice, company:, client:, status: :overdue, amount: 2000, amount_due: 2000, issue_date: 60.days.ago, due_date: 30.days.ago)

    with_forgery_protection do
      visit "/reports/outstanding-overdue-invoices"

      expect(page).to have_css("#react-root", wait: 10)
      expect(page).to have_content("Outstanding", wait: 10).or have_content("Overdue", wait: 10)
    end
  end

  it "supports the legacy outstanding and overdue route alias" do
    with_forgery_protection do
      visit "/reports/outstanding-overdue-invoice"

      expect(page).to have_css("#react-root", wait: 10)
    end
  end

  it "loads the payments report" do
    client = create(:client, company:, name: "Payment Client")
    invoice = create(:invoice, company:, client:, status: :paid, amount: 2000, amount_paid: 2000, amount_due: 0)
    create(:payment, invoice:, amount: 2000, status: :paid, transaction_date: Date.current)

    with_forgery_protection do
      visit "/reports/payments"

      expect(page).to have_css("#react-root", wait: 10)
      expect(page).to have_content("Payment", wait: 10)
    end
  end

  it "prevents employees from accessing reports" do
    employee = create(:user, current_workspace_id: company.id)
    create(:employment, company:, user: employee)
    employee.add_role :employee, company

    Warden.test_reset!
    sign_in(employee)

    with_forgery_protection do
      visit "/reports"

      expect(page).to have_css("#react-root", wait: 10)
      expect(page).to have_no_content("Time Entry Report", wait: 5).or have_current_path("/time-tracking", wait: 10)
    end
  end
end
