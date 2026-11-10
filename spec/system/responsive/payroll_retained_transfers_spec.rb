# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Retained transfers in mixed payroll preparation", type: :system, js: true do
  include_context "reviewed mercury consultant payroll"
  let(:console_errors) { [] }
  around { |example| travel_to(Time.utc(2026, 12, 5, 12)) { with_forgery_protection { example.run } } }
  after { expect(console_errors).to eq([]) }

  it "carries an accepted transfer and its reserved claim while preparing only another consultant" do
    claim = create(:expense, company:, user: worker, currency: "INR", amount: "500.25", date: "2026-11-20", description: "Synthetic retained claim")
    claim.approve!
    builder = Payroll::ConsultantRevision.new(run, actor: accounts)
    first = builder.create!(consultants: [{ employment_id: employment.id, expense_ids: [claim.id], acknowledged: true }],
      cutoff: Date.current.iso8601, expected_digest: nil, idempotency_key: "mixed-original")
    workflow.approve!(actor: accounts, stage: "accounts", expected_digest: first.digest)
    workflow.approve!(actor: owner, stage: "final", expected_digest: first.digest)
    instruction = prepared_instruction(revision: first)
    stub_mercury_reads
    write = stub_mercury_write(mercury_json(mercury_request("amount" => instruction.principal_minor.fdiv(100))))
    Payroll::MercuryPayment.new(run).submit!(actor: owner, instruction_id: instruction.id, expected_digest: instruction.frozen_digest)
    expect(instruction.reload.submission_state).to eq("accepted")
    frozen_line = first.payroll_payload.fetch("lines").sole.deep_dup
    expect(frozen_line.dig("amounts", "reimbursements_minor")).to eq(50_025)

    other = create(:user, current_workspace: company)
    other_employment = create(:employment, company:, user: other, joined_at: "2020-01-01", resigned_at: nil)
    record = create(:employee_record, employment: other_employment, private_details: bank_details).reload
    expect(record.private_details).to eq(bank_details)
    expect(record.read_attribute_before_type_cast(:private_details)).not_to include(bank_details.fetch("bank_account_number"))
    ConsultantCompensation.create!(employment: other_employment, created_by: owner, effective_on: "2026-11-01", monthly_fee: 40_000,
      hours_per_day: 8, weekdays: [1, 2, 3, 4, 5], payment_source: "mercury_us", legal_entity_name: legal_name, change_reason: "Synthetic other consultant")
    create(:timesheet_entry, user: other, project: work_entry.project, work_date: "2026-11-02", duration: 480)
    configure_synthetic_pto_policy(employment: other_employment)
    record_synthetic_pto_treatment(employment: other_employment)
    review_synthetic_billing_identity(employment: other_employment, reviewer: owner)
    binding = Payroll::BillingIdentity.new(employment).binding
    Payroll::BillingIdentity.new(employment, actor: owner).review!(submission_id: binding.fetch("submission_id"),
      expected_review_id: binding.fetch("review_id"), decision: "needs_information", reason: "Synthetic retained-person correction",
      manual_tax_reviewed: false, missing_pan_acknowledged: false, idempotency_key: "mixed-revoke")
    commands = []
    allow_any_instance_of(Payroll::ConsultantRevision).to receive(:create!).and_wrap_original do |original, **arguments|
      commands << arguments.fetch(:consultants)
      original.call(**arguments)
    end

    sign_in accounts
    page.current_window.resize_to(1440, 1000)
    expect(page.evaluate_script("window.innerWidth")).to eq(1440)
    page.driver.browser.on("Runtime.consoleAPICalled") { |event| console_errors << event if event["type"] == "error" }
    page.driver.browser.on("Runtime.exceptionThrown") { |event| console_errors << event }
    visit "/payroll/#{run.id}"
    expect(page).to have_no_text("Loading consultants…")
    within("[data-testid='preparation-consultant-#{employment.id}']") do
      expect(page).to have_text("Existing transfer retained")
      expect(page).to have_text("Amounts and claims from the existing transfer are automatically carried unchanged")
      expect(page).to have_text("This does not create a new payment.")
      expect(page).to have_no_text("will be left out")
      expect(page).to have_no_selector("input")
      expect(page).to have_no_text("Service-period fee review")
      expect(page).to have_no_text("Approved leave decisions and history")
      expect(page).to have_link("Billing identity", href: "/settings/billing-identity?user_id=#{worker.id}&company_id=#{company.id}")
    end
    if ENV["RETAINED_TRANSFER_SHOTS"]
      [1440, 375].each do |width|
        page.current_window.resize_to(width, 1000)
        expect(page.evaluate_script("window.innerWidth")).to eq(width)
        visit "/payroll/#{run.id}"
        expect(page).to have_text("Existing transfer retained")
        page.scroll_to(find("[data-testid='preparation-consultant-#{employment.id}']"), align: :center)
        area = page.evaluate_script("({ x: window.scrollX, y: window.scrollY, width: window.innerWidth, height: window.innerHeight })")
        FileUtils.mkdir_p(ENV.fetch("RETAINED_TRANSFER_SHOTS"))
        page.save_screenshot(File.join(ENV.fetch("RETAINED_TRANSFER_SHOTS"), "retained-transfer-#{width}.png"), area:)
      end
      page.current_window.resize_to(1440, 1000)
      visit "/payroll/#{run.id}"
      expect(page).to have_text("Existing transfer retained")
    end
    within("[data-testid='preparation-consultant-#{other_employment.id}']") do
      expect(page).to have_text("Can be included")
      check "Include in this revision"
      find("label", text: "I reviewed:").find("input[type='checkbox']").check
    end
    button = find_button("Save revision for approval", disabled: false)
    page.scroll_to(button, align: :center)
    button.click
    expect(page).to have_text("Revision 2")
    expect(commands.sole.map { |input| (input[:employment_id] || input["employment_id"]).to_i }).to eq([other_employment.id])
    revision = run.reload.current_revision
    expect(revision.payroll_payload.fetch("lines").pluck("employment_id")).to match_array([employment.id, other_employment.id])
    expect(revision.payroll_payload.fetch("lines").find { |line| line["employment_id"] == employment.id }).to eq(frozen_line)
    expect(revision.payroll_payload.fetch("lines").find { |line| line["employment_id"] == other_employment.id }.dig("amounts", "net_minor")).to eq(4_000_000)
    workflow.approve!(actor: accounts, stage: "accounts", expected_digest: revision.digest)
    workflow.approve!(actor: owner, stage: "final", expected_digest: revision.digest)
    expect(PayrollExpenseReservation.active.find_by!(expense: claim).payroll_revision_id).to eq(first.id)
    expect(instruction.reload.submission_state).to eq("accepted")
    expect(instruction.entitlement_minor).to eq(6_300_025)
    expect(PayrollPaymentInstruction.count).to eq(1)
    expect(write).to have_been_requested.once
  end
end
