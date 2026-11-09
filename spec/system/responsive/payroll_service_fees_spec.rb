# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Consultant service-period fee review", type: :system, js: true do
  include_context "approved mercury consultant payroll"
  let(:console_errors) { [] }
  around { |example| travel_to(Time.utc(2026, 12, 5, 12)) { example.run } }

  before do
    employment.update!(joined_at: Date.new(2026, 11, 1), resigned_at: Date.new(2026, 11, 13))
    ConsultantCompensation.create!(employment:, created_by: owner, effective_on: Date.new(2026, 11, 1), monthly_fee: 100_000,
      hours_per_day: 8, weekdays: [1, 2, 3, 4, 5], payment_source: "india", legal_entity_name: "Synthetic India entity",
      change_reason: "Synthetic service period")
    work_entry.update!(duration: 72 * 60, review_status: :approved)
    configure_synthetic_pto_policy
    run
  end

  after { expect(console_errors).to eq([]) }

  def sign_in_at_width(user, width = 1440)
    sign_in user
    page.current_window.resize_to(width, 1000)
    @viewport_width = width
    expect(page.evaluate_script("window.innerWidth")).to eq(width)
    browser = page.driver.browser.page
    browser.on("Runtime.consoleAPICalled") do |event|
      console_errors << event["args"].map { |arg| arg["value"] || arg["description"] }.join(" ") if event["type"] == "error"
    end
    browser.on("Runtime.exceptionThrown") { |event| console_errors << event.dig("exceptionDetails", "text") }
  end

  def click_in_view(name)
    expect(page).to have_css("h2", text: "Accounts preparation", exact_text: true)
    expect(page).to have_no_text("Loading consultants…")
    control = find_button(name)
    page.scroll_to(control, align: :center)
    control.click
  end

  def capture_viewport(name, control)
    return unless ENV["SERVICE_FEE_SHOTS"]

    expect(page.evaluate_script("window.innerWidth")).to eq(@viewport_width)
    page.scroll_to(control, align: :center)
    area = page.evaluate_script("({ x: window.scrollX, y: window.scrollY, width: window.innerWidth, height: window.innerHeight })")
    FileUtils.mkdir_p(ENV.fetch("SERVICE_FEE_SHOTS"))
    page.save_screenshot(File.join(ENV.fetch("SERVICE_FEE_SHOTS"), "#{name}-viewport-final.png"), area:)
  end

  def open_fee_review(width = 1440)
    sign_in_at_width(owner, width)
    visit "/payroll/#{run.id}"
    find("summary", text: "Service-period fee review", exact_text: true).click
    expect(page).to have_field("Service-period base fee (INR)", with: "")
    expect(page).to have_text("Scheduled service: 4800.0 minutes")
    fill_in "Service-period base fee (INR)", with: "50000"
    fill_in "Reason for this period fee", with: "Agreed November service-period base"
  end

  [1440, 375].each do |width|
    it "reviews the explicit basis, unpaid time and both approvals at #{width}px" do
      open_fee_review(width)
      capture_viewport("service-fee-input-#{width}", find_field("Service-period base fee (INR)"))
      click_button "Save service-period basis"
      expect(page).to have_no_field("Service-period base fee (INR)")
      find("summary", text: "Approved leave decisions and history", exact_text: true).click
      select "Deduct confirmed unpaid this month", from: "Current leave treatment"
      fill_in "Leave decision reason", with: "Eight explicitly unpaid hours"
      click_button "Approve leave decision"
      expect(page).to have_text("Fee estimate INR 45,000.00")
      sign_out owner
      sign_in_at_width(accounts, width)
      visit "/payroll/#{run.id}"
      check "Include in this revision"
      find("label", text: "I reviewed:").find("input[type='checkbox']").check
      click_in_view "Save revision for approval"
      expect(page).to have_text("Reviewed service-period basis")
      expect(page).to have_text("Agreed November service-period base")
      click_in_view "Approve as accounts"
      expect(page).to have_text("Accounts approved")
      expect(page.evaluate_script("window.innerWidth")).to eq(width)
      sign_out accounts
      sign_in_at_width(owner, width)
      visit "/payroll/#{run.id}"
      click_in_view "Approve as owner and reserve claims"
      expect(page).to have_text("Both reviewers approved this revision.")
      expect(page.evaluate_script("window.innerWidth")).to eq(width)
      line = run.reload.current_revision.payroll_payload.fetch("lines").sole
      expect(line.dig("amounts", "net_minor")).to eq(4_500_000)
      expect(line.dig("preparation", "service_fee_review", "amount_minor")).to eq("5000000")
      expect(PayrollIndiaHandoff.count).to eq(0)
      expect(PayrollPaymentInstruction.count).to eq(0)
      capture_viewport("reviewed-period-basis-#{width}", find("h4", text: "Reviewed service-period basis", exact_text: true))
    end
  end

  it "keeps a rejected draft and requires refreshed service dates before saving" do
    open_fee_review
    employment.update!(resigned_at: Date.new(2026, 11, 12))
    click_button "Save service-period basis"
    expect(page).to have_text("Service period changed; refresh before reviewing")
    expect(page).to have_field("Service-period base fee (INR)", with: "50000", disabled: true)
    expect(page).to have_field("Reason for this period fee", with: "Agreed November service-period base", disabled: true)
    expect(ConsultantServiceFeeReview.count).to eq(0)
    capture_viewport("stale-period-draft", find_field("Service-period base fee (INR)", disabled: true))
    click_button "Refresh period details"
    expect(page).to have_field("Service-period base fee (INR)", with: "50000", disabled: false)
    expect(page).to have_text("Scheduled service: 4320.0 minutes")
    click_button "Save service-period basis"
    expect(page).to have_no_field("Service-period base fee (INR)")
    expect(ConsultantServiceFeeReview.count).to eq(1)
  end

  it "shares the reviewed basis with the consultant leave dialog and fee preview" do
    sign_in_at_width(owner)
    visit "/consultant-payroll"
    click_button "PTO and decisions #{worker.full_name}"
    within("[role='dialog']") do
      find("summary", text: "Service-period fee review", exact_text: true).click
      fill_in "Service-period base fee (INR)", with: "50000"
      fill_in "Reason for this period fee", with: "Explicit basis before leave review"
      click_button "Save service-period basis"
      expect(page).to have_text("Saved period base: INR 50,000.00")
      select "Deduct confirmed unpaid this month", from: "Current leave treatment"
      fill_in "Leave decision reason", with: "Explicit eight-hour deduction"
      click_button "Approve leave decision"
      expect(page).to have_text("Explicit eight-hour deduction")
    end
    click_button "Close"
    click_button "Review #{worker.full_name}"
    within("[role='dialog']") do
      expect(page).to have_text("Monthly fee (INR)")
      expect(page).to have_text("Reviewed service-period base (INR)")
      expect(page).to have_text("Service dates and terms are covered by the saved period-fee review.")
    end
  end

  it "retries the original command after a committed save loses its response and the context is refreshed" do
    lose_response = true
    allow_any_instance_of(Api::V1::PayrollServiceFeesController).to receive(:render_period).and_wrap_original do |original, *arguments, **options|
      if original.receiver.action_name == "create" && lose_response
        lose_response = false
        original.receiver.render(json: { errors: "Synthetic response lost after commit" }, status: 503)
      else
        original.call(*arguments, **options)
      end
    end
    open_fee_review
    click_button "Save service-period basis"
    expect(page).to have_text("Synthetic response lost after commit")
    original = ConsultantServiceFeeReview.sole
    click_button "Refresh period details"
    expect(page).to have_text("Saved period base: INR 50,000.00")
    click_button "Save service-period basis"
    expect(page).to have_no_field("Service-period base fee (INR)")
    expect(ConsultantServiceFeeReview.count).to eq(1)
    expect(ConsultantServiceFeeReview.sole.id).to eq(original.id)
  end
end
