# frozen_string_literal: true

require "rails_helper"
require "csv"
require "tmpdir"

RSpec.describe "Private employee records browser workflow", type: :system, js: true do
  let(:company) { create(:company) }
  let(:admin) { create(:user, current_workspace: company) }
  let(:employee) { create(:user, current_workspace: company) }
  let!(:employment) { create(:employment, company:, user: employee, joined_at: "2020-01-01", resigned_at: nil) }

  before do
    enable_synthetic_payroll(company.id)
    create(:employment, company:, user: admin, joined_at: "2020-01-01", resigned_at: nil)
    admin.add_role(:admin, company)
    employee.add_role(:employee, company)
  end

  def open_records(actor, target: employee)
    sign_in(actor)
    @console_errors = []
    page.driver.browser.on("Runtime.consoleAPICalled") do |event|
      @console_errors << event if event["type"] == "error"
    end
    visit "/team/#{target.id}/employee-records?company_id=#{company.id}"
    expect(page).to have_css("h2", text: "Personal and employment information")
  end

  def expect_mobile_fit
    expect(page.evaluate_script("document.documentElement.scrollWidth <= window.innerWidth + 1")).to be(true)
  end

  def capture_records(filename)
    page.evaluate_async_script(<<~JS)
      const done = arguments[0];
      window.scrollTo(0, 0);
      document.fonts.ready.then(() => Promise.all(document.getAnimations().map(animation => animation.finished.catch(() => {}))))
        .then(() => requestAnimationFrame(() => requestAnimationFrame(done)));
    JS
    page.save_screenshot(Rails.root.join("tmp/capybara/#{filename}"), full: true)
  end

  def downloaded_file(filename, &action)
    Dir.mktmpdir("employee-records-download") do |directory|
      downloads = page.driver.browser.downloads
      downloads.set_behavior(save_path: directory)
      expect(downloads.wait(10, &action)).to be(true)
      File.binread(File.join(directory, filename))
    end
  end

  it "lets staff save family, emergency and bank information without submitting admin salary keys" do
    employment.create_employee_record!(private_details: { salary_amount: "1200", salary_currency: "INR" })
    with_forgery_protection do
      open_records(employee)
      expect(page).to have_link("Employee records", href: "/settings/employee-records")
      expect(page).not_to have_content("Administrator reports and reminders")
      expect(page).not_to have_button("Save manual payment")
      expect(page).not_to have_field("Upload Contract")
      expect(page).to have_link("Edit personal and contact information", href: "/settings/profile/edit")
      click_button "Edit employee records"
      expect(page).not_to have_field("Salary amount")
      fill_in "Account holder name", with: "Synthetic Employee"
      fill_in "Bank name", with: "Synthetic Bank"
      fill_in "Bank account number", with: "001234567890"
      fill_in "IFSC", with: "SBIN0001234"
      fill_in "Emergency contact name", with: "Synthetic Contact"
      fill_in "Emergency contact phone", with: "9999999999"
      click_button "Add family member"
      fill_in "Family member name", with: "Synthetic Family"
      fill_in "Family member date of birth", with: "2000-01-02"
      fill_in "Relationship", with: "Sibling"
      click_button "Save employee records"
      expect(page).to have_css("[role='status']", text: "Employee records saved.")
      expect(page).to have_content("Synthetic Family")
      expect(page).to have_content("••••••••7890")
      expect(page).not_to have_content("001234567890")
      expect(employment.reload.employee_record.private_details).to include("salary_amount" => "1200",
        "bank_account_number" => "001234567890", "emergency_contact_name" => "Synthetic Contact")
      [320, 375, 1440].each do |width|
        page.current_window.resize_to(width, 900)
        expect_mobile_fit
      end
      capture_records("employee-records-staff.png")
      expect(@console_errors).to be_empty
    end
  end

  it "uploads a private PAN copy and explains an unavailable attachment without losing the page" do
    with_forgery_protection do
      open_records(employee)
      attach_file "Upload PAN copy", Rails.root.join("spec/support/fixtures/pdf-file.pdf")
      expect(page).to have_button("Download · pdf-file.pdf")
      document = employment.employee_documents.find_by!(kind: "pan")
      expect(document.uploaded_by).to eq(employee)
      downloaded = downloaded_file("pdf-file.pdf") { click_button "Download · pdf-file.pdf" }
      expect(downloaded).to eq(File.binread(Rails.root.join("spec/support/fixtures/pdf-file.pdf")))
      expect(page).to have_button("Download · pdf-file.pdf", disabled: false)
      document.file.blob.service.delete(document.file.blob.key)
      click_button "Download · pdf-file.pdf"
      expect(page).to have_css("[role='alert']", text: "Document is unavailable. Please contact your workspace administrator.")
      expect(page).to have_button("Download · pdf-file.pdf", disabled: false)
      expect(@console_errors).to be_empty
    end
  end

  it "lets administrators record salary and external payments, upload contracts and manage private reports and reminders" do
    with_forgery_protection do
      open_records(admin)
      click_button "Edit employee records"
      fill_in "Salary amount", with: "5000.25"
      fill_in "Salary currency", with: "INR"
      select "Monthly", from: "Salary frequency"
      fill_in "Salary effective date", with: "2026-10-01"
      click_button "Save employee records"
      expect(page).to have_css("[role='status']", text: "Employee records saved.")
      fill_in "Paid date", with: "2026-10-02"
      fill_in "Payment amount", with: "5000.25"
      fill_in "Payment reference", with: "synthetic-external-ref"
      click_button "Save manual payment"
      expect(page).to have_content("synthetic-external-ref")
      expect(page).to have_content("No money was sent.")
      attach_file "Upload Contract", Rails.root.join("spec/support/fixtures/pdf-file.pdf")
      expect(page).to have_button("Download · pdf-file.pdf")
      fill_in "Report name", with: "Synthetic Insurance"
      click_button "Insurance preset"
      click_button "Save report definition"
      expect(page).to have_content("Report definition saved.")
      report = company.employee_reports.find_by!(name: "Synthetic Insurance")
      expect(report.columns).to include("family_members", "phone")
      month = find_field("Report month").value
      csv = downloaded_file("employee-report-#{report.id}-#{month}.csv") { click_button "Download CSV" }
      rows = CSV.parse(csv, headers: true)
      expect(rows.headers).to include("Employee name", "Family members (JSON)", "Phone")
      expect(rows["Employee name"]).to include(employee.full_name)
      expect(page).to have_button("Download CSV", disabled: false)
      check "Enable advance occasion reminders"
      expect(page).to have_css("[role='status']", text: "Occasion reminder preference saved.")
      expect(company.reload.employee_record_setting.occasion_reminders_enabled).to be(true)
      page.current_window.resize_to(375, 900)
      expect_mobile_fit
      capture_records("employee-records-admin-mobile.png")
      click_button "Delete Synthetic Insurance"
      expect(page).to have_content("No saved report definitions.")
      expect(company.employee_reports.count).to eq(0)
      expect(@console_errors).to be_empty
    end
  end

  it "paginates manually recorded payments and keeps admin controls absent for staff" do
    21.times do |index|
      employment.employee_payments.create!(created_by: admin, paid_on: "2026-10-01", amount: "1.25",
        currency: "INR", reference: "synthetic-payment-#{index}")
    end
    open_records(employee)
    expect(page).to have_content("Page 1")
    expect(page).to have_content("synthetic-payment-20")
    click_button "Next"
    expect(page).to have_content("Page 2")
    expect(page).to have_css("p", text: "synthetic-payment-0", exact_text: true)
    expect(page).to have_button("Next", disabled: true)
    expect(page).not_to have_button("Save manual payment")
    expect(@console_errors).to be_empty
  end

  it "edits a saved report in place and downloads the changed columns on desktop and mobile" do
    report = company.employee_reports.create!(name: "Synthetic Directory", columns: %w[name email])
    with_forgery_protection do
      open_records(admin)
      page.current_window.resize_to(1440, 1000)
      click_button "Edit Synthetic Directory"
      expect(page).to have_css("h3", text: "Edit report definition")
      expect(page).to have_field("Report name", with: "Synthetic Directory")
      expect(page).to have_css("#reportName:focus")
      expect(page).to have_checked_field("Work email")
      fill_in "Report name", with: "Synthetic Contacts"
      uncheck "Work email"
      page.execute_script("arguments[0].focus()", find(:checkbox, "Phone"))
      page.driver.browser.keyboard.type(:space)
      expect(page).to have_checked_field("Phone")
      capture_records("employee-report-editor-desktop.png")
      pending_updates = Queue.new
      page.driver.browser.network.intercept(pattern: "*/api/v1/employee_reports/#{report.id}")
      page.driver.browser.on(:request) { |request| pending_updates << request }
      click_button "Save report changes"
      request = pending_updates.pop(timeout: Capybara.default_max_wait_time)
      expect(request).to be_present
      expect(page).to have_field("Report name", disabled: true)
      expect(page).to have_field("Phone", disabled: true)
      ["Save report changes", "Cancel", "Edit Synthetic Directory", "Delete Synthetic Directory", "Download CSV"].each do |action|
        expect(page).to have_button(action, disabled: true)
      end
      request.continue
      page.driver.browser.command("Fetch.disable")
      expect(page).to have_css("[role='status']", text: "Report definition saved.")
      expect(report.reload).to have_attributes(name: "Synthetic Contacts", columns: %w[name phone])
      expect(company.employee_reports.pluck(:id)).to eq([report.id])
      month = find_field("Report month").value
      csv = downloaded_file("employee-report-#{report.id}-#{month}.csv") { click_button "Download CSV" }
      expect(CSV.parse(csv, headers: true).headers).to eq(["Employee name", "Phone"])
      expect(page).to have_button("Save report definition", disabled: true)
      page.current_window.resize_to(375, 900)
      capture_records("employee-report-saved-mobile.png")
      click_button "Edit Synthetic Contacts"
      expect(page).to have_field("Report name", with: "Synthetic Contacts")
      expect(page).to have_css("#reportName:focus")
      expect(page.evaluate_script(<<~JS)).to be(true)
        (() => {
          const { top, bottom } = document.activeElement.getBoundingClientRect();
          return top >= 0 && bottom <= window.innerHeight;
        })()
      JS
      expect_mobile_fit
      capture_records("employee-report-editor-mobile.png")
      expect(@console_errors).to be_empty
    end
  end

  it "cancels report edits, retains rejected drafts for retry and resets an edited report after deletion" do
    report = company.employee_reports.create!(name: "Synthetic Directory", columns: %w[name email])
    with_forgery_protection do
      open_records(admin)
      click_button "Edit Synthetic Directory"
      fill_in "Report name", with: "Cancelled draft"
      uncheck "Work email"
      check "Phone"
      click_button "Cancel"
      expect(page).to have_button("Save report definition", disabled: true)
      expect(report.reload).to have_attributes(name: "Synthetic Directory", columns: %w[name email])
      click_button "Edit Synthetic Directory"
      expect(page).to have_field("Report name", with: "Synthetic Directory")
      expect(page).to have_checked_field("Work email")
      expect(page).to have_unchecked_field("Phone")
      fill_in "Report name", with: "   "
      uncheck "Work email"
      check "Phone"
      click_button "Save report changes"
      expect(page).to have_css("[role='alert']", text: "Name can't be blank")
      expect(page).to have_field("Report name", with: "   ")
      expect(page).to have_checked_field("Phone")
      expect(page).to have_unchecked_field("Work email")
      expect(report.reload).to have_attributes(name: "Synthetic Directory", columns: %w[name email])
      fill_in "Report name", with: "Synthetic Retry"
      click_button "Save report changes"
      expect(page).to have_css("[role='status']", text: "Report definition saved.")
      expect(report.reload).to have_attributes(name: "Synthetic Retry", columns: %w[name phone])
      expect(company.employee_reports.pluck(:id)).to eq([report.id])
      click_button "Edit Synthetic Retry"
      click_button "Delete Synthetic Retry"
      expect(page).to have_content("No saved report definitions.")
      expect(page).to have_button("Save report definition", disabled: true)
      expect(page).to have_field("Report name", with: "")
      expect(page).not_to have_button("Cancel")
      expect(@console_errors).to be_empty
    end
  end

  it "rejects a reminder link for another workspace before fetching private records" do
    sign_in(admin)
    visit "/team/#{employee.id}/employee-records?company_id=#{company.id + 1}"
    expect(page).to have_css("[role='alert']", text: "Employee records are unavailable in this workspace.")
    expect(page).not_to have_css("[data-testid='employee-records']")
    expect(page.evaluate_script(<<~JS)).to eq([])
      performance.getEntriesByType('resource').filter(entry => entry.name.includes('/api/v1/employee_record')).map(entry => entry.name)
    JS
  end

  it "clears private data and unsaved edits when the selected employee changes" do
    employment.create_employee_record!(private_details: { bank_name: "Synthetic Employee Bank" })
    admin.employments.find_by!(company:).create_employee_record!(private_details: { bank_name: "Synthetic Admin Bank" })
    open_records(admin)
    expect(page).to have_content("Synthetic Employee Bank")
    click_button "Edit employee records"
    fill_in "Bank name", with: "Unsaved private draft"
    page.execute_script(<<~JS, "/team/#{admin.id}/employee-records?company_id=#{company.id}")
      window.history.pushState({}, '', arguments[0]);
      window.dispatchEvent(new PopStateEvent('popstate'));
    JS
    expect(page).to have_content("Synthetic Admin Bank")
    expect(page).not_to have_content("Synthetic Employee Bank")
    expect(page).not_to have_field("Bank name", with: "Unsaved private draft")
    expect(@console_errors).to be_empty
  end

  it "keeps clients outside private records and does not fetch private endpoints" do
    client = create(:user, current_workspace: company)
    create(:employment, company:, user: client, resigned_at: nil)
    client.add_role(:client, company)
    sign_in(client)
    visit "/team/#{employee.id}/employee-records?company_id=#{company.id}"
    expect(page).not_to have_css("[data-testid='employee-records']")
    expect(page).not_to have_link("Employee records")
    expect(page.evaluate_script(<<~JS)).to eq([])
      performance.getEntriesByType('resource').filter(entry => entry.name.includes('/api/v1/employee_record')).map(entry => entry.name)
    JS
  end

  it "denies a coworker's private tab and hides the tab when the entitlement is off" do
    sign_in(employee)
    visit "/team/#{admin.id}/employee-records?company_id=#{company.id}"
    expect(page).to have_css("[role='alert']", text: "Employee records are unavailable")
    expect(page).not_to have_css("[data-testid='employee-records']")
    allow(ENV).to receive(:[]).with("MIRU_PAYROLL_ENABLED").and_return("false")
    visit "/settings/profile"
    expect(page).not_to have_link("Employee records")
    visit "/settings/employee-records"
    expect(page).to have_css("[role='alert']", text: "Employee records are unavailable")
  end
end
