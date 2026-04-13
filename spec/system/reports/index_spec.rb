# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Reports", type: :system, js: true do
  let!(:company) { create(:company, base_currency: "USD", name: "Reports Corp", plan_tier: "paid") }
  let!(:admin) { create(:user, current_workspace: company) }

  before do
    create(:employment, company:, user: admin)
    admin.add_role :admin, company
  end

  def expect_reports_shell(title = "Reports")
    expect(page).to have_css("#react-root", wait: 10)
    expect(page).to have_content(title, wait: 10)
  end

  context "when signed in as an admin" do
    before do
      sign_in(admin)
    end

    it "loads the reports index with the main report cards" do
      with_forgery_protection do
        visit "/reports"

        expect_reports_shell
        expect(page).to have_content("Time Reports", wait: 10)
        expect(page).to have_content("Revenue by Client", wait: 10)
        expect(page).to have_content("Accounts Aging", wait: 10)
        expect(page).to have_content("Outstanding", wait: 10)
      end
    end

    it "routes schedule reports to preferences" do
      with_forgery_protection do
        visit "/reports"

        expect_reports_shell
        click_button "Schedule reports"

        expect(page).to have_current_path("/settings/preferences", wait: 10)
        expect(page).to have_content("Monthly Cash Flow Digest", wait: 10)
      end
    end

    it "shows localized report labels in Hindi" do
      admin.update!(locale: "hi")

      with_forgery_protection do
        visit "/reports"

        expect_reports_shell("रिपोर्ट")
        expect(page).to have_content("उपलब्ध रिपोर्ट", wait: 10)
        expect(page).to have_content("वित्तीय", wait: 10)
        expect(page).to have_button("रिपोर्ट शेड्यूल करें", wait: 10)
      end
    end

    it "shows localized revenue by client labels in Hindi" do
      admin.update!(locale: "hi")
      client = create(:client, company:, name: "Hindi Revenue Client")
      create(:project, client:, billable: true, name: "Hindi Revenue Project")
      create(:invoice, company:, client:, status: :sent, amount: 1200, amount_due: 1200)
      create(
        :invoice,
        company:,
        client:,
        status: :paid,
        amount: 800,
        amount_paid: 800,
        amount_due: 0
      )

      with_forgery_protection do
        visit "/reports/revenue-by-client"

        expect_reports_shell("क्लाइंट के अनुसार राजस्व")
        expect(page).to have_content("कुल राजस्व", wait: 10)
        expect(page).to have_content("क्लाइंट राजस्व विवरण", wait: 10)
        expect(page).to have_button("निर्यात", wait: 10)
        expect(page).to have_button("रिपोर्ट साझा करें", wait: 10)
        expect(page).to have_button("सभी समय", wait: 10)
        expect(page).to have_content("भुगतान राशि", wait: 10)
        expect(page).to have_content("सफलतापूर्वक एकत्रित", wait: 10)
        expect(page).to have_content("ध्यान आवश्यक", wait: 10)
        expect(page).to have_content("क्लाइंट", wait: 10)
        expect(page).to have_content("अतिदेय राशि", wait: 10)
        expect(page).to have_content("बकाया राशि", wait: 10)
        expect(page).to have_content("भुगतान राशि", wait: 10)
        expect(page).to have_content("Hindi Revenue Client", wait: 10)
        expect(page).to have_content("1 में से 1 क्लाइंट दिखा रहा है", wait: 10)
        expect(page).to have_content("सभी क्लाइंट लोड हो गए", wait: 10)
      end
    end

    it "shows localized revenue by client empty state in Hindi" do
      admin.update!(locale: "hi")

      with_forgery_protection do
        visit "/reports/revenue-by-client"

        expect_reports_shell("क्लाइंट के अनुसार राजस्व")
        expect(page).to have_content("कोई परिणाम नहीं।", wait: 10)
        expect(page).to have_content(
          "चयनित फ़िल्टर के लिए कोई क्लाइंट राजस्व डेटा उपलब्ध नहीं है।",
          wait: 10
        )
        expect(page).to have_content("0 में से 0 क्लाइंट दिखा रहा है", wait: 10)
      end
    end

    it "shows localized payment report labels in Hindi" do
      admin.update!(locale: "hi")
      client = create(:client, company:, name: "Hindi Payment Client")
      invoice = create(:invoice, company:, client:, status: :paid, amount: 2000, amount_paid: 2000, amount_due: 0)
      create(:payment, invoice:, amount: 2000, status: :paid, transaction_date: Date.current)

      with_forgery_protection do
        visit "/reports/payments"

        expect_reports_shell("भुगतान रिपोर्ट")
        expect(page).to have_content("भुगतान विवरण", wait: 10)
        expect(page).to have_content("कुल भुगतान", wait: 10)
        expect(page).to have_content("भुगतान संख्या", wait: 10)
        expect(page).to have_button("निर्यात", wait: 10)
        expect(page).to have_content("सभी विधियाँ", wait: 10)
        expect(page).to have_content("भुगतान विधि", wait: 10)
        expect(page).to have_content("शीर्ष विधि", wait: 10)
        expect(page).to have_content("भुगतान विधियों का विवरण", wait: 10)
        expect(page).to have_content("तारीख", wait: 10)
        expect(page).to have_content("क्लाइंट", wait: 10)
        expect(page).to have_content("इनवॉइस", wait: 10)
        expect(page).to have_content("राशि", wait: 10)
        expect(page).to have_content("नोट्स", wait: 10)
        expect(page).to have_content("स्थिति", wait: 10)
        expect(page).to have_content("1 में से 1 भुगतान दिखाए जा रहे हैं", wait: 10)
        expect(page).to have_content("सभी भुगतान लोड हो गए", wait: 10)
      end
    end

    it "shows localized payment report empty-state and multi-client filters in Hindi" do
      admin.update!(locale: "hi")
      first_client = create(:client, company:, name: "Hindi Filter Alpha")
      second_client = create(:client, company:, name: "Hindi Filter Beta")
      create(:invoice, company:, client: first_client, status: :sent)
      create(:invoice, company:, client: second_client, status: :sent)

      with_forgery_protection do
        visit "/reports/payments"

        expect_reports_shell("भुगतान रिपोर्ट")
        click_button("सभी क्लाइंट")
        click_button("Hindi Filter Alpha")
        click_button("Hindi Filter Alpha")
        click_button("Hindi Filter Beta")
        expect(page).to have_content("2 क्लाइंट", wait: 10)
        expect(page).to have_content("चयनित अवधि के लिए कोई भुगतान नहीं मिला।", wait: 10)
        expect(page).to have_content("0 में से 0 भुगतान दिखाए जा रहे हैं", wait: 10)
      end
    end

    it "shows localized payment report pagination prompt in Hindi" do
      admin.update!(locale: "hi")
      client = create(:client, company:, name: "Hindi Payment Scroll Client")

      26.times do |index|
        invoice = create(
          :invoice,
          company:,
          client:,
          status: :paid,
          amount: 100 + index,
          amount_paid: 100 + index,
          amount_due: 0
        )
        create(
          :payment,
          invoice:,
          amount: 100 + index,
          status: :paid,
          transaction_date: Date.current - index.days
        )
      end

      with_forgery_protection do
        visit "/reports/payments"

        expect_reports_shell("भुगतान रिपोर्ट")
        expect(page).to have_content("26 में से 25 भुगतान दिखाए जा रहे हैं", wait: 10)
        expect(page).to have_content("और भुगतान लोड करने के लिए स्क्रॉल करें", wait: 10)
      end
    end

    it "shows localized payment report error-state in Hindi" do
      admin.update!(locale: "hi")

      allow_any_instance_of(Api::V1::Reports::PaymentsController).to receive(:index) do |controller|
        controller.send(:authorize, :report, :index?)
        controller.render json: { error: "boom" }, status: :internal_server_error
      end

      with_forgery_protection do
        visit "/reports/payments"

        expect(page).to have_css("#react-root", wait: 10)
        expect(page).to have_content("भुगतान रिपोर्ट लोड करने में असमर्थ", wait: 10)
      end
    end

    it "loads the time entry report" do
      client = create(:client, company:, name: "Alpha Client")
      project = create(:project, client:, name: "Alpha Project")
      create(:project_member, user: admin, project:)
      create(:timesheet_entry, user: admin, project:, duration: 480, work_date: Date.current)

      with_forgery_protection do
        visit "/reports/time-entry"

        expect_reports_shell("Time Reports")
        expect(page).to have_content("Total Hours", wait: 10)
        expect(page).to have_content("Export", wait: 10)
      end
    end

    it "loads more time-entry report rows on scroll" do
      client = create(:client, company:, name: "Scroll Client")
      project = create(:project, client:, name: "Scroll Project")
      create(:project_member, user: admin, project:)
      create_list(:timesheet_entry, 55, user: admin, project:, duration: 60, work_date: Date.current)

      with_forgery_protection do
        visit "/reports/time-entry"

        expect_reports_shell("Time Reports")
        expect(page).to have_content("Loaded 1 of 2 report pages", wait: 10)

        page.execute_script("window.scrollTo(0, document.body.scrollHeight)")

        expect(page).to have_content("Loaded 2 of 2 report pages", wait: 10)
        expect(page).to have_content("All report rows loaded", wait: 10)
      end
    end

    it "restores time entry filters from the permalink" do
      included_client = create(:client, company:, name: "Filtered Alpha Client")
      excluded_client = create(:client, company:, name: "Filtered Beta Client")
      included_project = create(:project, client: included_client, name: "Alpha Project")
      excluded_project = create(:project, client: excluded_client, name: "Beta Project")
      create(:project_member, user: admin, project: included_project)
      create(:project_member, user: admin, project: excluded_project)
      create(:timesheet_entry, user: admin, project: included_project, duration: 240, work_date: Date.current)
      create(:timesheet_entry, user: admin, project: excluded_project, duration: 180, work_date: Date.current)

      with_forgery_protection do
        visit "/reports/time-entry?clients=#{included_client.id}&groupBy=client&preset=custom&from=#{Date.current.iso8601}&to=#{Date.current.iso8601}"

        expect_reports_shell("Time Reports")
        expect(page).to have_content("Filtered Alpha Client", wait: 10)
        expect(page).to have_no_content("Filtered Beta Client")
      end
    end

    it "copies the time entry report permalink" do
      client = create(:client, company:, name: "Permalink Client")
      project = create(:project, client:, name: "Permalink Project")
      create(:project_member, user: admin, project:)
      create(:timesheet_entry, user: admin, project:, duration: 120, work_date: Date.current)

      with_forgery_protection do
        visit "/reports/time-entry?clients=#{client.id}"

        page.execute_script(<<~JS)
          window.__copiedReportUrl = null;
          Object.defineProperty(navigator, "clipboard", {
            configurable: true,
            value: {
              writeText: async function(value) {
                window.__copiedReportUrl = value;
              }
            }
          });
        JS

        click_button "Share report"

        expect(page).to have_button("Link copied", wait: 10)
        copied_url = page.evaluate_script("window.__copiedReportUrl")
        expect(copied_url).to include("/reports/time-entry?")
        expect(copied_url).to include("clients=#{client.id}")
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

    it "loads more revenue rows on scroll" do
      26.times do |index|
        client = create(:client, company:, name: "Revenue Client #{index}")
        create(:project, client:, billable: true, name: "Revenue Project #{index}")
        create(
          :invoice,
          company:,
          client:,
          status: :paid,
          amount: 1000 + index,
          amount_paid: 1000 + index,
          amount_due: 0
        )
      end

      with_forgery_protection do
        visit "/reports/revenue-by-client"

        expect_reports_shell("Revenue by Client")
        expect(page).to have_content("Showing 25 of 26 clients", wait: 10)

        page.execute_script("window.scrollTo(0, document.body.scrollHeight)")

        expect(page).to have_content("Showing 26 of 26 clients", wait: 10)
        expect(page).to have_content("All clients loaded", wait: 10)
      end
    end

    it "restores revenue-by-client filters from the permalink" do
      included_client = create(:client, company:, name: "Revenue Filter Alpha")
      excluded_client = create(:client, company:, name: "Revenue Filter Beta")
      create(:project, client: included_client, billable: true, name: "Revenue Alpha Project")
      create(:project, client: excluded_client, billable: true, name: "Revenue Beta Project")
      create(:invoice, company:, client: included_client, status: :paid, amount: 1200, amount_paid: 1200, amount_due: 0)
      create(:invoice, company:, client: excluded_client, status: :paid, amount: 1800, amount_paid: 1800, amount_due: 0)

      with_forgery_protection do
        visit "/reports/revenue-by-client?clients=#{included_client.id}"

        expect_reports_shell("Revenue by Client")
        expect(page).to have_content("Revenue Filter Alpha", wait: 10)
        expect(page).to have_no_content("Revenue Filter Beta")
      end
    end

    it "copies the revenue by client permalink" do
      client = create(:client, company:, name: "Revenue Share Client")
      create(:invoice, company:, client:, status: :paid, amount: 1200, amount_paid: 1200, amount_due: 0)

      with_forgery_protection do
        visit "/reports/revenue-by-client?clients=#{client.id}"

        page.execute_script(<<~JS)
          window.__copiedReportUrl = null;
          Object.defineProperty(navigator, "clipboard", {
            configurable: true,
            value: {
              writeText: async function(value) {
                window.__copiedReportUrl = value;
              }
            }
          });
        JS

        click_button "Share report"

        expect(page).to have_button("Link copied", wait: 10)
        copied_url = page.evaluate_script("window.__copiedReportUrl")
        expect(copied_url).to include("/reports/revenue-by-client")
        expect(copied_url).to include("clients=#{client.id}")
      end
    end

    it "loads the accounts aging report" do
      client = create(:client, company:, name: "Slow Payer")
      create(:project, client:, billable: true, name: "Slow Payer Project")
      create(:invoice, company:, client:, status: :sent, amount: 5000, amount_due: 5000, issue_date: 90.days.ago, due_date: 60.days.ago)

      with_forgery_protection do
        visit "/reports/accounts-aging"

        expect_reports_shell("Accounts Aging")
        expect(page).to have_content("Total Due", wait: 10)
      end
    end

    it "shows localized accounts aging labels in Hindi" do
      admin.update!(locale: "hi")
      client = create(:client, company:, name: "Hindi Aging Client")
      create(:project, client:, billable: true, name: "Hindi Aging Project")
      create(
        :invoice,
        company:,
        client:,
        status: :sent,
        amount: 5000,
        amount_due: 5000,
        issue_date: 90.days.ago,
        due_date: 60.days.ago
      )

      with_forgery_protection do
        visit "/reports/accounts-aging"

        expect_reports_shell("अकाउंट्स एजिंग रिपोर्ट")
        expect(page).to have_content("कुल देय", wait: 10)
        expect(page).to have_content("एजिंग वितरण", wait: 10)
        expect(page).to have_content("इनवॉइस एजिंग विवरण", wait: 10)
        expect(page).to have_button("निर्यात", wait: 10)
        expect(page).to have_button("रिपोर्ट साझा करें", wait: 10)
        expect(page).to have_button("क्लाइंट", wait: 10)
        expect(page).to have_content("0-30 दिन", wait: 10)
        expect(page).to have_content("31-60 दिन", wait: 10)
        expect(page).to have_content("61-90 दिन", wait: 10)
        expect(page).to have_content("90+ दिन", wait: 10)
        expect(page).to have_content("Hindi Aging Client", wait: 10)
      end
    end

    it "restores accounts aging filters from the permalink" do
      included_client = create(:client, company:, name: "Aging Filter Alpha")
      excluded_client = create(:client, company:, name: "Aging Filter Beta")
      create(:project, client: included_client, billable: true, name: "Aging Alpha Project")
      create(:project, client: excluded_client, billable: true, name: "Aging Beta Project")
      create(:invoice, company:, client: included_client, status: :sent, amount: 5000, amount_due: 5000, issue_date: 90.days.ago, due_date: 60.days.ago)
      create(:invoice, company:, client: excluded_client, status: :sent, amount: 2500, amount_due: 2500, issue_date: 90.days.ago, due_date: 60.days.ago)

      with_forgery_protection do
        visit "/reports/accounts-aging?clients=#{included_client.id}&asOf=#{Date.current.iso8601}"

        expect_reports_shell("Accounts Aging")
        expect(page).to have_content("Aging Filter Alpha", wait: 10)
        expect(page).to have_no_content("Aging Filter Beta")
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

    it "restores outstanding report filters from the permalink" do
      eur_client = create(:client, company:, name: "Euro Receivable")
      usd_client = create(:client, company:, name: "Dollar Receivable")
      create(:invoice, company:, client: eur_client, status: :overdue, amount: 2000, amount_due: 2000, currency: "EUR", issue_date: 60.days.ago, due_date: 30.days.ago)
      create(:invoice, company:, client: usd_client, status: :overdue, amount: 1500, amount_due: 1500, currency: "USD", issue_date: 60.days.ago, due_date: 30.days.ago)

      with_forgery_protection do
        visit "/reports/outstanding-overdue-invoices?tab=overdue&currency=EUR"

        expect(page).to have_css("#react-root", wait: 10)
        expect(page).to have_content("Euro Receivable", wait: 10)
        expect(page).to have_no_content("Dollar Receivable")
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

    it "loads more payments report rows on scroll" do
      client = create(:client, company:, name: "Payment Scroll Client")
      invoice = create(:invoice, company:, client:, status: :paid, amount: 2000, amount_paid: 2000, amount_due: 0)

      26.times do |index|
        create(
          :payment,
          invoice:,
          amount: 100 + index,
          status: :paid,
          transaction_date: Date.current - index.days
        )
      end

      with_forgery_protection do
        visit "/reports/payments"

        expect(page).to have_css("#react-root", wait: 10)
        expect(page).to have_content("Showing 25 of 26 payments", wait: 10)

        page.execute_script("window.scrollTo(0, document.body.scrollHeight)")

        expect(page).to have_content("Showing 26 of 26 payments", wait: 10)
        expect(page).to have_content("All payments loaded", wait: 10)
      end
    end

    it "restores payment report filters from the permalink" do
      included_client = create(:client, company:, name: "Payment Filter Alpha")
      excluded_client = create(:client, company:, name: "Payment Filter Beta")
      included_invoice = create(:invoice, company:, client: included_client, status: :paid, amount: 2000, amount_paid: 2000, amount_due: 0)
      excluded_invoice = create(:invoice, company:, client: excluded_client, status: :paid, amount: 2000, amount_paid: 2000, amount_due: 0)
      create(:payment, invoice: included_invoice, amount: 500, transaction_type: :visa, status: :paid, transaction_date: Date.current)
      create(:payment, invoice: excluded_invoice, amount: 650, transaction_type: :bank_transfer, status: :failed, transaction_date: Date.current)

      with_forgery_protection do
        visit "/reports/payments?clients=#{included_client.id}&paymentMethod=visa&status=paid&from=#{Date.current.iso8601}&to=#{Date.current.iso8601}"

        expect(page).to have_css("#react-root", wait: 10)
        expect(page).to have_content("Payment Filter Alpha", wait: 10)
        expect(page).to have_no_content("Payment Filter Beta")
        expect(page).to have_content("Visa")
        expect(page).to have_no_content("Bank transfer")
      end
    end
  end

  it "prevents employees from accessing reports" do
    employee = create(:user, current_workspace: company)
    create(:employment, company:, user: employee)
    employee.add_role :employee, company

    sign_in(employee)

    with_forgery_protection do
      visit "/reports"

      expect(page).to have_css("#react-root", wait: 10)
      expect(page).to have_no_content("Time Reports", wait: 5).or have_current_path("/time-tracking", wait: 10)
    end
  end

  it "redirects free-plan admins to billing" do
    free_company = create(:company, name: "Free Corp", plan_tier: "free")
    free_admin = create(:user, current_workspace: free_company)
    create(:employment, company: free_company, user: free_admin)
    free_admin.add_role :admin, free_company

    sign_in(free_admin)

    with_forgery_protection do
      visit "/reports"

      expect(page).to have_current_path("/settings/billing", wait: 10)
      expect(page).to have_content("Pick the package that fits now", wait: 10)
      expect(page).to have_content("Reports and analytics", wait: 10)
    end
  end

  it "hides the reports navigation for free-plan admins" do
    free_company = create(:company, name: "Free Corp", plan_tier: "free")
    free_admin = create(:user, current_workspace_id: free_company.id)
    create(:employment, company: free_company, user: free_admin)
    free_admin.add_role :admin, free_company

    sign_in(free_admin)

    with_forgery_protection do
      visit "/dashboard"

      expect(page).to have_no_link("Reports", wait: 10)
      expect(page).to have_link("Billing", wait: 10)
    end
  end
end
