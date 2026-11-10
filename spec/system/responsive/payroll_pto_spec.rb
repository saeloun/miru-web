# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Approved payroll PTO decisions", type: :system, js: true do
  let(:company) { create(:company, base_currency: "INR", timezone: "Asia/Kolkata") }
  let(:admin) { create(:user, current_workspace: company) }
  let(:consultant) { create(:user, current_workspace: company) }
  let(:console_errors) { [] }
  let!(:employment) { create(:employment, company:, user: consultant, joined_at: "2020-01-01", resigned_at: nil) }

  around { |example| travel_to(Time.utc(2026, 10, 19, 12)) { example.run } }

  before do
    enable_synthetic_payroll(company.id)
    create(:employment, company:, user: admin, joined_at: "2020-01-01", resigned_at: nil)
    admin.add_role(:admin, company)
    consultant.add_role(:employee, company)
    ConsultantCompensation.create!(employment:, created_by: admin, effective_on: "2026-09-01", monthly_fee: "100000",
      hours_per_day: "8", weekdays: [1, 2, 3, 4, 5], payment_source: "india", legal_entity_name: "Synthetic India entity", change_reason: "Synthetic approved terms")
    calendar = create(:holiday, company:, year: 2026)
    %w[2026-09-01 2026-09-02].each { |date| create(:holiday_info, holiday: calendar, date:, category: :national) }
    browser = page.driver.browser.page
    browser.on("Runtime.consoleAPICalled") do |event|
      console_errors << event["args"].map { |arg| arg["value"] || arg["description"] }.join(" ") if event["type"] == "error"
    end
    browser.on("Runtime.exceptionThrown") { |event| console_errors << event.dig("exceptionDetails", "text") }
  end
  after { expect(console_errors).to eq([]) }

  def expect_pto_fact(label, expected)
    selector = ".//section[@aria-label='Approved PTO facts']//dt[normalize-space(.)='#{label}']/following-sibling::dd[1]"
    expect(page.document).to have_xpath(selector, text: expected, exact_text: true)
  end

  def configure_opening(hours)
    click_button "Configure approved PTO policy"
    { "PTO effective date" => "2026-09-01", "Opening as of" => "2026-09-01", "Reconciled opening hours" => hours,
      "Monthly accrual hours" => "0", "Accrual day" => "1", "Leave year start month" => "4", "Leave year start day" => "1",
      "Advance limit hours" => "80", "Unexplained hours threshold" => "8", "Negative balance threshold" => "8",
      "Opening evidence reference" => "synthetic-reconciled-opening", "Policy approval reason" => "Synthetic approved engagement policy" }.each do |label, value|
      fill_in label, with: value
    end
    select "Owner review at leave-year boundary", from: "Carry and expiry treatment"
    select "Explicit approved origin-period amount and hours", from: "Historical recovery rate basis"
    click_button "Approve PTO policy"
    expect(page).to have_css("[aria-label='Approved PTO facts']")
    expect(page).not_to have_button("Approve PTO policy")
  end

  [
    ["paid", 150, "40", "Approve paid PTO", "30.0", "10.0", "0.0"],
    ["unpaid", 100, "40", "Deduct confirmed unpaid this month", "40.0", "0.0", "60.0"],
    ["advance", 100, "0", "Allow advance PTO", "-60.0", "60.0", "0.0"],
    ["unexplained", 100, "0", nil, "0.0", "0.0", "0.0"],
    ["historical", 160, "-40", nil, "-40.0", "0.0", "0.0"]
  ].each do |name, worked, opening, decision, closing, paid, unpaid|
    it "reviews the #{name} 160-hour case through approved forms without automatic deductions" do
      project = create(:project, client: create(:client, company:), billable: false)
      time_entry = create(:timesheet_entry, project:, user: consultant, work_date: "2026-09-03", duration: worked * 60, review_status: :approved)
      sign_in admin
      with_forgery_protection do
        visit "/consultant-payroll"
        expect(page).to have_button("PTO and decisions #{consultant.full_name}")
        click_button "PTO and decisions #{consultant.full_name}"
        within("[role='dialog']") do
          configure_opening(opening)
          if decision
            select decision, from: "Current leave treatment"
            fill_in "Leave decision reason", with: "Synthetic explicit #{name} treatment"
            click_button "Approve leave decision"
            expect(page).to have_text("Synthetic explicit #{name} treatment")
          end
          within("[aria-label='Approved PTO facts']") do
            { "Opening PTO hours" => "#{opening}.0", "Closing PTO hours" => closing,
              "Approved paid leave hours" => paid, "Confirmed unpaid hours" => unpaid }.each do |label, expected|
              expect_pto_fact(label, expected)
            end
            expect(page).to have_text("An owner or admin must record an explicit leave treatment before payroll approval.") if name == "unexplained"
          end
          if name == "unexplained"
            page.save_screenshot("/tmp/miru-pto-unexplained-blocked-20261108.png")
            ["Request correction", "Defer recovery with full pay", "Waive with a reason"].each do |treatment|
              select treatment, from: "Current leave treatment"
              fill_in "Leave decision reason", with: "Synthetic #{treatment}"
              click_button "Approve leave decision"
              expect(page).to have_text("Synthetic #{treatment}")
              within("[aria-label='Approved PTO facts']") do
                expect_pto_fact("Confirmed unpaid hours", "0.0")
                expect_pto_fact("Closing PTO hours", "0.0")
              end
            end
            select "Approve an explicit split", from: "Current leave treatment"
            fill_in "Unpaid allocation hours", with: "23"
            fill_in "Deferred allocation hours", with: "37"
            fill_in "Leave decision reason", with: "Synthetic split unpaid and full-pay defer"
            click_button "Approve leave decision"
            expect(page).to have_text("Synthetic split unpaid and full-pay defer")
            within("[aria-label='Approved PTO facts']") do
              expect_pto_fact("Confirmed unpaid hours", "23.0")
              expect_pto_fact("Deferred hours", "37.0")
            end
          end
          page.current_window.resize_to(375, 812)
          expect(page.evaluate_script("document.querySelector('[role=dialog]').scrollWidth <= document.querySelector('[role=dialog]').clientWidth + 1")).to be(true)
          page.save_screenshot("/tmp/miru-pto-#{name}-20261108.png")
          if name == "advance"
            time_entry.update!(duration: 9_600)
            click_button "Refresh leave facts"
            expect(page).to have_button("Clear obsolete leave decision")
            fill_in "Clearance reason", with: "Synthetic approved work correction fills the original gap"
            click_button "Clear obsolete leave decision"
            expect(page).to have_text("Synthetic approved work correction fills the original gap")
            within("[aria-label='Approved PTO facts']") do
              expect_pto_fact("Closing PTO hours", "0.0")
              expect_pto_fact("Approved paid leave hours", "0.0")
            end
          end
        end
        if name == "paid"
          final_reviewer = create(:user, current_workspace: company)
          create(:employment, company:, user: final_reviewer, joined_at: "2020-01-01", resigned_at: nil)
          final_reviewer.add_role(:owner, company)
          bank_details = { "bank_account_name" => "Synthetic Consultant", "bank_name" => "Synthetic Bank",
                           "bank_country" => "IN", "bank_account_currency" => "INR",
                           "bank_account_number" => "123456789012", "bank_ifsc" => "SYNT0000001" }
          record = create(:employee_record, employment:, private_details: bank_details).reload
          expect(record.private_details).to eq(bank_details)
          expect(record.read_attribute_before_type_cast(:private_details)).not_to include("Synthetic Consultant", "123456789012")
          run = PayrollRun.create!(company:, period: "2026-09-01", currency: "INR", accounts_reviewer: admin, final_reviewer:)
          review_synthetic_billing_identity(employment:, reviewer: final_reviewer)
          revision = Payroll::ConsultantRevision.new(run, actor: admin).create!(
            consultants: [{ employment_id: employment.id, acknowledged: true }], cutoff: "2026-09-30",
            expected_digest: nil, idempotency_key: "synthetic-paid-browser")
          workflow = Payroll::Workflow.new(run)
          workflow.approve!(actor: admin, stage: "accounts", expected_digest: revision.digest)
          workflow.approve!(actor: final_reviewer, stage: "final", expected_digest: revision.digest)
          bank_digest = Payroll::MercurySetup.digest(Payroll::IndiaReport.bank_details(employment.reload).sort.to_h)
          handoff = Payroll::IndiaHandoff.new(run).create!(actor: final_reviewer, employment_id: employment.id,
            expected_digest: revision.digest, accounts_email: "synthetic-accounts@example.test", bank_confirmed: true, expected_bank_digest: bank_digest)
          sign_out admin
          sign_in final_reviewer
          visit "/payroll/#{run.id}"
          page.current_window.resize_to(375, 1100)
          within("[aria-label='India accounts payments']") do
            expect(page).to have_text("Email queued", wait: 15)
            within("[aria-label='Approved PTO facts']") do
              { "Opening PTO hours" => "40.0", "Approved paid leave hours" => "10.0", "Closing PTO hours" => "30.0" }.each do |label, expected|
                expect_pto_fact(label, expected)
              end
            end
            expect(page).to have_text("INR 100,000.00")
          end
          expect(page.evaluate_script("document.documentElement.scrollWidth <= window.innerWidth + 1")).to be(true)
          page.execute_script("window.scrollTo(0, 0)")
          page.evaluate_async_script("const done = arguments[0]; requestAnimationFrame(() => requestAnimationFrame(done));")
          page.save_screenshot("/tmp/miru-pto-approved-india-paid-mobile-20261108.png", full: true)
          mail = PayrollIndiaMailer.report(handoff.payroll_india_deliveries.sole.id).message
          preview = "/tmp/miru-pto-paid-mail-preview-20261108.html"
          File.write(preview, mail.html_part.body.decoded)
          visit "file://#{preview}"
          expect(page).to have_text("Approved paid leave")
          expect(page).to have_text("Opening PTO hours")
          expect(page).to have_text("Closing PTO hours")
          expect(page).to have_no_text("Not classified in source records")
          [375, 1100].each do |width|
            page.current_window.resize_to(width, 900)
            expect(page.evaluate_script("document.documentElement.scrollWidth <= window.innerWidth + 1")).to be(true)
            page.save_screenshot("/tmp/miru-pto-paid-mail-#{width}-20261108.png")
          end
        end
      end
    end
  end

  [["unpaid", "9.9833", "40.0", "93,760.44"], ["split", "8.9833", "39.0", "94,385.44"]].each do |treatment, unpaid, closing, fee|
    it "reloads an approved fractional-minute #{treatment} decision and previews the exact fee" do
      project = create(:project, client: create(:client, company:), billable: false)
      create(:timesheet_entry, project:, user: consultant, work_date: "2026-09-03", duration: 9_001.002, review_status: :approved)
      submitted = []
      if treatment == "split"
        decision_path = "/payroll_pto/#{employment.id}/decisions"
        page.driver.browser.on("Network.requestWillBeSent") do |event|
          request = event.fetch("request")
          submitted << request["postData"] if request["method"] == "POST" && request.fetch("url").include?(decision_path)
        end
      end
      sign_in admin
      with_forgery_protection do
        visit "/consultant-payroll"
        click_button "PTO and decisions #{consultant.full_name}"
        within("[role='dialog']") do
          configure_opening("40")
          if treatment == "split"
            select "Approve an explicit split", from: "Current leave treatment"
            fill_in "Paid allocation hours", with: "1"
            select "Deduct confirmed unpaid this month", from: "Treatment for remaining gap"
            expect(page).to have_field("Paid allocation hours", with: "1")
            expect(page).to have_field("Unpaid allocation hours", disabled: true, placeholder: "Exact remaining gap")
            expect(page).to have_text("Exact source gap: 598.998 minutes.")
            select "Defer recovery with full pay", from: "Treatment for remaining gap"
            expect(page).to have_field("Unpaid allocation hours", with: "", disabled: false)
            expect(page).to have_field("Deferred allocation hours", disabled: true, placeholder: "Exact remaining gap")
            select "Deduct confirmed unpaid this month", from: "Treatment for remaining gap"
            expect(page).to have_field("Deferred allocation hours", with: "", disabled: false)
            expect(page).to have_field("Paid allocation hours", with: "1")
            page.execute_script("document.querySelector('[id$=\"-remaining\"]').scrollIntoView({block: 'center'})")
            page.evaluate_async_script("const done = arguments[0]; requestAnimationFrame(() => requestAnimationFrame(done));")
            page.save_screenshot("/tmp/miru-pto-explicit-remainder-form-20261109.png")
          else
            select "Deduct confirmed unpaid this month", from: "Current leave treatment"
          end
          fill_in "Leave decision reason", with: "Synthetic exact fractional-minute treatment"
          click_button "Approve leave decision"
          expect(page).to have_text("Synthetic exact fractional-minute treatment")
          if treatment == "split"
            expect(JSON.parse(submitted.sole).dig("pto_decision", "allocations"))
              .to eq([{ "kind" => "paid", "hours" => "1" }, { "kind" => "unpaid", "hours" => "remaining" }])
          end
        end
        visit "/consultant-payroll"
        click_button "PTO and decisions #{consultant.full_name}"
        within("[role='dialog']") do
          expect_pto_fact("Confirmed unpaid hours", unpaid)
          expect_pto_fact("Closing PTO hours", closing)
          expect_pto_fact("Unresolved hours", "0.0")
          expect(page).not_to have_text("Attendance changed after the leave decision. Refresh and approve its treatment again.")
          expect(page).not_to have_css("[role='alert']")
          click_button "Close"
        end
        click_button "Review #{consultant.full_name}"
        within("[role='dialog']") do
          expect(page).to have_field("payroll-unpaid", with: unpaid, readonly: true)
          click_button "Recalculate preview"
          expect(page).to have_button("Recalculate preview", disabled: false)
          expect(page).not_to have_css("[role='alert']")
          expect(page).to have_text(fee)
          page.save_screenshot("/tmp/miru-pto-fractional-#{treatment}-preview-20261109.png")
        end
      end
    end
  end

  it "keeps negative history at the configured year boundary and resolves exit review only through an explicit owner decision" do
    project = create(:project, client: create(:client, company:))
    create(:timesheet_entry, project:, user: consultant, work_date: "2026-09-03", duration: 9_600, review_status: :approved)
    employment.update!(resigned_at: Date.new(2026, 9, 30))
    sign_in admin
    with_forgery_protection do
      visit "/consultant-payroll"
      click_button "PTO and decisions #{consultant.full_name}"
      within("[role='dialog']") { configure_opening("-40") }
      find_button("Close").send_keys(:escape)
      travel_to(Time.utc(2027, 3, 31, 12))
      sign_in admin
      visit "/consultant-payroll"
      fill_in "Leave review as of", with: "2027-03-31"
      click_button "Load leave review queue"
      within("[aria-label='Leave year-end and exit review']") do
        expect(page).to have_text("Negative balance: 40.0 h")
        expect(page).to have_text("Leave-year review")
        expect(page).to have_text("Exit review")
        page.save_screenshot("/tmp/miru-pto-yearend-exit-worklist-20261109.png")
        click_button "Review leave case #{consultant.full_name}"
      end
      within("[role='dialog']") do
        within("[aria-label='Historical leave obligations']") do
          select "Waive with a reason", from: "Historical treatment"
          fill_in "Historical decision reason", with: "Synthetic owner exit waiver after full review"
          click_button "Approve historical treatment"
        end
        expect(page).to have_text("Synthetic owner exit waiver after full review")
        within("[aria-label='Approved PTO facts']") do
          expect_pto_fact("Closing PTO hours", "0.0")
          expect_pto_fact("Confirmed unpaid hours", "0.0")
        end
        page.save_screenshot("/tmp/miru-pto-yearend-exit-reviewed-20261108.png")
      end
    end
  end

  it "uses the approved partial unpaid quantity in the existing reimbursement preview without a manual override" do
    project = create(:project, client: create(:client, company:))
    create(:timesheet_entry, project:, user: consultant, work_date: "2026-09-03", duration: 6_000, review_status: :approved)
    ledger = Payroll::PtoLedger.new(employment, actor: admin)
    ledger.configure!(effective_on: "2026-09-01", opening_on: "2026-09-01", opening_hours: "0", monthly_accrual_hours: "0",
      accrual_day: "1", leave_year_month: "4", leave_year_day: "1", carry_rule: "review", rate_basis: "origin_period_fee",
      advance_limit_hours: "80", exception_threshold_hours: "8", negative_threshold_hours: "8", evidence: "synthetic-opening",
      reason: "Synthetic approved policy", idempotency_key: "preview-policy")
    ledger.allocate!(period: Date.new(2026, 9, 1), allocations: [{ kind: "unpaid", hours: "23" }, { kind: "defer", hours: "37" }],
      reason: "Synthetic explicit partial unpaid and full-pay remainder", expected_digest: Payroll::PtoFacts.new(employment, month: Date.new(2026, 9, 1)).call.fetch("digest"), idempotency_key: "preview-allocation")
    sign_in admin
    with_forgery_protection do
      visit "/consultant-payroll"
      click_button "Review #{consultant.full_name}"
      within("[role='dialog']") do
        expect(find("#payroll-unpaid").value).to eq("23.0")
        expect(page).to have_field("payroll-unpaid", readonly: true)
        click_button "Recalculate preview"
        expect(page).to have_button("Recalculate preview", disabled: false)
        expect(page).not_to have_css("[role='alert']")
        expect(page).to have_text("85,625.00")
      end
    end
  end
end
