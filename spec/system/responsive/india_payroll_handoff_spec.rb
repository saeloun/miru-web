# frozen_string_literal: true

require "rails_helper"

RSpec.describe "India payroll accounts handoff", type: :system, js: true do
  include_context "approved mercury consultant payroll"

  let(:console_errors) { [] }
  let(:mailbox) { "accounts@example.test" }
  let!(:claim) do
    expense = create(:expense, company:, user: worker, currency: "INR", amount: "500.25", date: "2026-11-20",
      description: "Synthetic internet reimbursement")
    expense.approve!
    expense.update!(approved_at: Time.utc(2026, 11, 25, 12))
    expense
  end

  around { |example| travel_to(Time.utc(2026, 12, 5, 12)) { example.run } }

  before do
    ConsultantCompensation.create!(employment:, created_by: owner, effective_on: Date.new(2026, 11, 1), monthly_fee: 62_500,
      hours_per_day: 8, weekdays: [1, 2, 3, 4, 5], payment_source: "india", legal_entity_name: "Synthetic India Pvt Ltd",
      change_reason: "India accounts handoff")
    @revision = Payroll::ConsultantRevision.new(run, actor: accounts).create!(consultants: [{ employment_id: employment.id,
      confirmed_unpaid_hours: "0", expense_ids: [claim.id], acknowledged: true }], cutoff: "2026-11-30",
      expected_digest: nil, idempotency_key: "synthetic-india-browser")
    workflow.approve!(actor: accounts, stage: "accounts", expected_digest: @revision.digest)
    workflow.approve!(actor: owner, stage: "final", expected_digest: @revision.digest)
    browser = page.driver.browser.page
    browser.on("Runtime.consoleAPICalled") do |event|
      console_errors << event["args"].map { |arg| arg["value"] || arg["description"] }.join(" ") if event["type"] == "error"
    end
    browser.on("Runtime.exceptionThrown") { |event| console_errors << event.dig("exceptionDetails", "text") }
  end

  after { expect(console_errors).to eq([]) }

  it "lets an owner send the approved report and accounts record partial then full credit on desktop and mobile" do
    sign_in owner
    with_forgery_protection do
      visit "/payroll/#{run.id}"
      within("[aria-label='India accounts payments']") do
        expect(page).to have_text("Synthetic internet reimbursement", wait: 15)
        expect(page).to have_text("INR 63,000.25")
        expect(page).to have_text("••••9012")
        expect(page).to have_no_text(bank_details.fetch("bank_account_number"))
        fill_in "Accounts recipient email", with: mailbox
        check "I verified the beneficiary and recipient mailbox."
        screenshot("owner-ready-desktop")
        click_button "Send approved report to accounts"
        expect(page).to have_text("Email queued")
        expect(page).to have_no_button("Send approved report to accounts")
      end
      handoff = PayrollIndiaHandoff.sole
      expect(handoff.entitlement_minor).to eq(6_300_025)
      Payroll::IndiaDelivery.new(handoff.payroll_india_deliveries.sole).deliver
      click_button "Refresh India handoffs"
      within("[aria-label='India accounts payments']") do
        expect(page).to have_text("Sent to Accounts — Awaiting Payment")
        expect(page).to have_no_button("Record confirmed credit")
        screenshot("owner-awaiting-payment-desktop")
      end
      expect(claim.reload).to be_approved
      expect(claim.paid_at).to be_nil
      sign_out owner
      sign_in accounts
      page.driver.resize(390, 1000)
      visit "/payroll/#{run.id}"
      within("[aria-label='India accounts payments']") do
        expect(page).to have_text("Sent to Accounts — Awaiting Payment", wait: 15)
        expect(page).to have_no_button("Send approved report to accounts")
        fill_in "Actual INR credit", with: "1000.00"
        fill_in "Credit date", with: "2026-12-06"
        fill_in "Bank transaction reference", with: "SYNTHETIC-INR-PART-1"
        click_button "Record confirmed credit"
        expect(page).to have_css("[role='alert']", text: "Enter a credit date within or after this payroll month and not in the future.")
        expect(handoff.payroll_india_credits.count).to eq(0)
        fill_in "Credit date", with: "2026-12-05"
        fill_in "Bank transaction reference", with: "SYNTHETIC-INR-PART-1"
        click_button "Record confirmed credit"
        expect(page).to have_text("Partially credited")
        expect(page).to have_text("Remaining: INR 62,000.25")
        expect(claim.reload).to be_approved
        screenshot("accounts-partial-mobile")
        fill_in "Actual INR credit", with: "62000.25"
        fill_in "Bank transaction reference", with: "SYNTHETIC-INR-PART-2"
        click_button "Record confirmed credit"
        expect(page).to have_css("div", text: "Credited", exact_text: true)
        expect(page).to have_text("Remaining: INR 0.00")
        find("summary", text: "Delivery and credit history").click
        expect(page).to have_text("Credit INR 1,000.00")
        expect(page).to have_text("Credit INR 62,000.25")
        expect(find("summary", text: "Delivery and credit history").evaluate_script("this.getBoundingClientRect().height")).to be >= 40
        screenshot("accounts-credited-mobile")
      end
      expect(handoff.reload.credited_minor).to eq(6_300_025)
      expect(claim.reload).to be_paid
      expect(claim.paid_at).to be_present
      expect(PayrollExpenseReservation.where(payroll_run: run, expense: claim).sole.settled_at).to be_present
      expect(page.evaluate_script("document.documentElement.scrollWidth <= window.innerWidth + 1")).to be(true)
    end
  end

  it "explains which Indian bank details to fix and disables sending an incomplete report" do
    employment.employee_record.update!(private_details: bank_details.except("bank_name"))
    sign_in owner
    with_forgery_protection do
      visit "/payroll/#{run.id}"
      within("[aria-label='India accounts payments']") do
        expect(page).to have_text("Complete the account holder, bank name, account number and IFSC in Employee records, then refresh.", wait: 15)
        fill_in "Accounts recipient email", with: mailbox
        check "I verified the beneficiary and recipient mailbox."
        expect(page).to have_button("Send approved report to accounts", disabled: true)
        expect(page).to have_no_text("SWIFT")
      end
    end
  end

  it "lets accounts resolve an unknown email before the owner retries just the unsent attempt" do
    handoff = Payroll::IndiaHandoff.new(run).create!(actor: owner, employment_id: employment.id,
      expected_digest: @revision.digest, accounts_email: mailbox, bank_confirmed: true, expected_bank_digest: synthetic_india_bank_digest)
    handoff.payroll_india_deliveries.sole.update!(state: "uncertain", started_at: 20.minutes.ago)
    sign_in accounts
    with_forgery_protection do
      visit "/payroll/#{run.id}"
      within("[aria-label='India accounts payments']") do
        expect(page).to have_text("Delivery uncertain — review required", wait: 15)
        expect(page).to have_no_button("Retry unsent email")
        select "Confirmed not delivered", from: "Verified delivery outcome"
        fill_in "Provider or mailbox evidence reference", with: "Synthetic provider review 123"
        check "I confirmed the previous delivery worker has stopped."
        click_button "Record delivery review"
        expect(page).to have_text("Email not sent")
      end
      sign_out accounts
      sign_in owner
      visit "/payroll/#{run.id}"
      within("[aria-label='India accounts payments']") do
        click_button "Retry unsent email"
        expect(page).to have_text("Email queued")
      end
      expect(handoff.payroll_india_deliveries.order(:attempt_number).pluck(:state)).to eq(%w[failed queued])
      expect(handoff.reload.credited_minor).to eq(0)
      expect(claim.reload.paid_at).to be_nil
    end
  end

  it "refreshes the payroll revision and totals before confirming a newly approved report" do
    sign_in owner
    with_forgery_protection do
      visit "/payroll/#{run.id}"
      expect_payroll_fact("Current revision", "#{@revision.number} · #{@revision.digest.first(12)}")
      expect_payroll_fact("Recorded net payroll total", "INR 63,000.25")
      within("[aria-label='India accounts payments']") do
        fill_in "Accounts recipient email", with: mailbox
        check "I verified the beneficiary and recipient mailbox."
      end

      click_button "Refresh India handoffs"
      within("[aria-label='India accounts payments']") do
        expect(page).to have_field("Accounts recipient email", with: "")
        expect(page).to have_unchecked_field("I verified the beneficiary and recipient mailbox.")
        expect(page).to have_button("Send approved report to accounts", disabled: true)
        fill_in "Accounts recipient email", with: mailbox
        check "I verified the beneficiary and recipient mailbox."
      end
      expect_payroll_fact("Current revision", "#{@revision.number} · #{@revision.digest.first(12)}")
      expect(run.reload.current_revision.digest).to eq(@revision.digest)
      expect(PayrollIndiaHandoff.count).to eq(0)
      expect(PayrollIndiaDelivery.count).to eq(0)

      fresh_revision = approve_revision(parent: @revision.digest)
      expect(fresh_revision.digest).not_to eq(@revision.digest)
      click_button "Refresh India handoffs"

      expect_payroll_fact("Current revision", "#{fresh_revision.number} · #{fresh_revision.digest.first(12)}")
      expect_payroll_fact("Calculation revision", fresh_revision.digest.first(12))
      expect_payroll_fact("Recorded net payroll total", "INR 62,500.00")
      expect_payroll_fact("Calculated net total", "INR 62,500.00")
      expect(page).to have_css("p", text: "#{company.name} · Owner approved", exact_text: true)
      within("[aria-label='India accounts payments']") do
        expect(page).to have_no_css("[role='alert']")
        expect(page).to have_unchecked_field("I verified the beneficiary and recipient mailbox.")
        expect(page).to have_field("Accounts recipient email", with: "")
        expect(page).to have_button("Send approved report to accounts", disabled: true)
        screenshot("owner-refreshed-payroll-desktop")
      end
    end
  end

  it "requires a new owner confirmation when bank details change after the displayed preview" do
    fail_next_load = false
    fail_next_response = false
    handoff_statuses = []
    allow_any_instance_of(Api::V1::PayrollIndiaHandoffsController).to receive(:render).and_wrap_original do |original, *arguments, **options|
      if original.receiver.action_name == "create" && fail_next_response
        fail_next_response = false
        options = options.merge(json: { errors: "Synthetic India handoff response failed" }, status: 503)
      end
      result = original.call(*arguments, **options)
      handoff_statuses << original.receiver.response.status if original.receiver.action_name == "create"
      result
    end
    allow_any_instance_of(Api::V1::PayrollIndiaHandoffsController).to receive(:index).and_wrap_original do |original, *arguments|
      if fail_next_load
        fail_next_load = false
        original.receiver.render json: { errors: "Synthetic India handoff refresh failed" }, status: 503
      else
        original.call(*arguments)
      end
    end
    sign_in owner
    with_forgery_protection do
      visit "/payroll/#{run.id}"
      within("[aria-label='India accounts payments']") do
        expect(page).to have_text("••••9012", wait: 15)
        fill_in "Accounts recipient email", with: mailbox
        check "I verified the beneficiary and recipient mailbox."
        employment.employee_record.update!(private_details: bank_details.merge("bank_account_number" => "999999998888"))
        click_button "Send approved report to accounts"
        expect(page).to have_text("••••8888")
        expect(handoff_statuses).to eq([409])
        expect(PayrollIndiaHandoff.count).to eq(0)
        expect(PayrollIndiaDelivery.count).to eq(0)
        expect(page).to have_unchecked_field("I verified the beneficiary and recipient mailbox.")
        expect(page).to have_field("Accounts recipient email", with: "")
        expect(page).to have_button("Send approved report to accounts", disabled: true)
        expect(page).to have_css("[role='alert']", text: "Bank details changed; reload and verify the beneficiary again")
        screenshot("owner-bank-reconfirmation-desktop")
        fill_in "Accounts recipient email", with: mailbox
        check "I verified the beneficiary and recipient mailbox."
        fail_next_response = true
        fail_next_load = true
        click_button "Send approved report to accounts"
        expect(page).to have_css("[role='alert']", text: "Synthetic India handoff refresh failed")
        expect(page).to have_css("[role='alert']", text: "Synthetic India handoff response failed")
        expect(handoff_statuses).to eq([409, 503])
        expect(PayrollIndiaHandoff.count).to eq(1)
        expect(PayrollIndiaDelivery.count).to eq(1)
        expect(page).to have_field("Accounts recipient email", with: mailbox)
        expect(page).to have_checked_field("I verified the beneficiary and recipient mailbox.")
        expect do
          click_button "Send approved report to accounts"
          expect(page).to have_text("Email queued")
        end.not_to have_enqueued_job
        expect(page).to have_no_css("[role='alert']")
        expect(handoff_statuses).to eq([409, 503, 201])
        expect(PayrollIndiaHandoff.count).to eq(1)
        expect(PayrollIndiaDelivery.count).to eq(1)
      end
      expect(PayrollIndiaHandoff.sole.report.dig("bank_details", "bank_account_number")).to eq("999999998888")
    end
  end

  it "renders the actual confidential email clearly at desktop and mobile widths" do
    handoff = Payroll::IndiaHandoff.new(run).create!(actor: owner, employment_id: employment.id,
      expected_digest: @revision.digest, accounts_email: mailbox, bank_confirmed: true, expected_bank_digest: synthetic_india_bank_digest)
    html = PayrollIndiaMailer.report(handoff.payroll_india_deliveries.sole.id).message.html_part.body.decoded
    [1400, 390].each do |width|
      page.driver.resize(width, 1000)
      visit "data:text/html;base64,#{Base64.strict_encode64(html)}"
      expect(page).to have_text("Confidential India payroll report")
      expect(page).to have_text("Synthetic internet reimbursement")
      expect(page).to have_text(bank_details.fetch("bank_account_number"))
      expect(page).to have_text("63,000.25")
      expect(page).to have_no_text("bank_digest")
      expect(page.evaluate_script("document.documentElement.scrollWidth <= window.innerWidth + 1")).to be(true)
      screenshot("confidential-email-#{width}")
    end
  end

  def expect_payroll_fact(label, value)
    expect(find("dt", exact_text: label).find(:xpath, "..").find("dd")).to have_text(value, exact: true)
  end

  def screenshot(name)
    return if ENV["INDIA_PAYROLL_SHOTS"].blank?

    directory = File.expand_path(ENV["INDIA_PAYROLL_SHOTS"], Rails.root)
    FileUtils.mkdir_p(directory)
    page.save_screenshot(File.join(directory, "#{name}.png"), full: true)
  end
end
