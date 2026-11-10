# frozen_string_literal: true

require "rails_helper"
require "uri"

RSpec.describe "Payroll profile completion requests", type: :system, js: true do
  include_context "approved mercury consultant payroll"
  let(:company) { create(:company, name: "Synthetic Profile Consultancy", base_currency: "INR") }
  let(:owner) { create(:user, first_name: "Synthetic", last_name: "Owner", email: "synthetic-owner@example.test") }
  let(:accounts) { create(:user, first_name: "Synthetic", last_name: "Accounts", email: "synthetic-accounts@example.test") }
  let(:worker) { create(:user, first_name: "Synthetic", last_name: "Missing", email: "synthetic-consultant@example.test") }
  let(:billing_identity_ready) { false }
  let(:console_errors) { [] }
  let(:request_commands) { [] }

  around { |example| travel_to(Time.utc(2026, 12, 5, 12)) { with_forgery_protection { example.run } } }
  after { expect(console_errors).to eq([]) }

  before do
    worker.update!(first_name: "Synthetic", last_name: "Missing", current_workspace: company)
    worker.add_role(:employee, company)
    employment.update!(joined_at: "2020-01-01")
    employment.employee_record.update!(private_details: bank_details.except("bank_name", "bank_country", "bank_account_currency"))
    work_entry.update!(review_status: :approved)
    configure_synthetic_pto_policy
    record_synthetic_pto_treatment
    @ready_employment = complete_consultant("Ready")
    @pending_employment = complete_consultant("Awaiting review")
    current = ConsultantBillingSubmission.heads.find_by!(employment: @pending_employment)
    Payroll::BillingIdentity.new(@pending_employment, actor: @pending_employment.user).submit!(
      facts: current.facts, expected_submission_id: current.id.to_s, reuse_pan_evidence: true,
      idempotency_key: "synthetic-unreviewed-profile")
    run
  end

  def complete_consultant(name)
    person = create(:user, first_name: "Synthetic", last_name: name, current_workspace: company)
    person.add_role(:employee, company)
    member = create(:employment, company:, user: person, joined_at: "2020-01-01", resigned_at: nil)
    create(:employee_record, employment: member, private_details: bank_details)
    ConsultantCompensation.create!(employment: member, created_by: owner, effective_on: "2026-11-01", monthly_fee: 40_000,
      hours_per_day: 8, weekdays: [1, 2, 3, 4, 5], payment_source: "mercury_us", legal_entity_name: legal_name,
      change_reason: "Synthetic complete consultant")
    create(:timesheet_entry, user: person, project: work_entry.project, work_date: "2026-11-02", duration: 480, review_status: :approved)
    configure_synthetic_pto_policy(employment: member)
    record_synthetic_pto_treatment(employment: member)
    review_synthetic_billing_identity(employment: member, reviewer: owner)
    member
  end

  def open_preparation(actor, width)
    sign_in actor
    page.current_window.resize_to(width, 1000)
    browser = page.driver.browser.page
    browser.on("Runtime.consoleAPICalled") { |event| console_errors << event if event["type"] == "error" }
    browser.on("Runtime.exceptionThrown") { |event| console_errors << event }
    browser.on("Network.requestWillBeSent") do |event|
      request = event.fetch("request")
      if request["method"] == "POST" && request.fetch("url").end_with?("/profile_completion_requests")
        request_commands << JSON.parse(request.fetch("postData"))
      end
    end
    visit "/payroll/#{run.id}"
    expect(page).to have_css("h2", text: "Accounts preparation", exact_text: true)
    expect(page).to have_no_text("Loading consultants…")
    expect(page.evaluate_script("window.innerWidth")).to eq(width)
  end

  def within_consultant(member, &block)
    within("[data-testid='preparation-consultant-#{member.id}']", &block)
  end

  def capture_request(width, suffix: "")
    return unless ENV["PROFILE_COMPLETION_SHOTS"]

    expect(page.evaluate_script("document.documentElement.scrollWidth <= window.innerWidth + 1")).to be(true)
    page.scroll_to(find("[data-testid='preparation-consultant-#{employment.id}']"), align: :center)
    area = page.evaluate_script("({ x: window.scrollX, y: window.scrollY, width: window.innerWidth, height: window.innerHeight })")
    FileUtils.mkdir_p(ENV.fetch("PROFILE_COMPLETION_SHOTS"))
    page.save_screenshot(File.join(ENV.fetch("PROFILE_COMPLETION_SHOTS"), "profile-request#{suffix}-#{width}.png"), area:)
  end

  [["owner", 1440], ["accounts", 375]].each do |actor, width|
    it "requests current missing details as #{actor} at #{width}px without blocking another consultant" do
      open_preparation(public_send(actor), width)
      within_consultant(@ready_employment) do
        expect(page).to have_text("Can be included")
        expect(page).to have_no_button("Request profile completion")
        check "Include in this revision" if actor == "accounts"
      end
      within_consultant(@pending_employment) { expect(page).to have_no_button("Request profile completion") }
      capture_request(width, suffix: "-action")
      within_consultant(employment) do
        expect(page).to have_button("Request profile completion")
        expect(page).to have_text("Bank details")
        expect(page).to have_text("Billing identity")
        click_button "Request profile completion"
        expect(page).to have_text("Request email queued")
        expect(page).to have_no_button("Request profile completion")
      end
      receipt = PayrollProfileCompletionRequest.sole
      expect(receipt.employment_id).to eq(employment.id)
      expect(receipt.recipient_id).to eq(worker.id)
      expect(request_commands.sole.keys).to match_array(%w[company_id employment_id expected_digest idempotency_key])
      expect(request_commands.sole.fetch("employment_id").to_i).to eq(employment.id)
      expect(run.reload.current_revision).to be_nil
      within_consultant(@ready_employment) do
        expect(page).to have_text("Can be included")
        expect(page).to have_checked_field("Include in this revision") if actor == "accounts"
      end
      capture_request(width)
      next unless actor == "owner"

      expect(ActionMailer::Base.delivery_method).to eq(:test)
      ActionMailer::Base.deliveries.clear
      PayrollProfileCompletionRequestJob.perform_now(receipt.id)
      expect(receipt.reload.state).to eq("sent")
      mail = ActionMailer::Base.deliveries.sole
      expect(mail.to).to eq([worker.email])
      body = mail.body.decoded
      links = body.scan(%r{https?://[^\s]+}).map { |value| URI(value) }
      expect(links.map { |url| "#{url.path}?#{url.query}" }).to match_array([
        "/settings/employee-records?company_id=#{company.id}", "/settings/billing-identity?company_id=#{company.id}"
      ])
      expect(body).not_to include(bank_details.fetch("bank_account_number"), "invoice authorization")
      visit "/payroll/#{run.id}"
      within_consultant(employment) { expect(page).to have_text("Request email sent") }
      sign_out owner
      sign_in worker
      bank_url = links.find { |url| url.path == "/settings/employee-records" }
      visit "#{bank_url.path}?#{bank_url.query}"
      expect(page).to have_current_path("/settings/employee-records?company_id=#{company.id}")
      expect(page).to have_css("[data-testid='employee-records']")
      expect(page).to have_button("Edit employee records")
    end
  end

  it "confirms one committed request with the same key after a lost response" do
    first_response = true
    allow_any_instance_of(Api::V1::PayrollProfileCompletionRequestsController).to receive(:create).and_wrap_original do |original, *arguments|
      original.call(*arguments)
      if first_response
        first_response = false
        original.receiver.response.status = 503
        original.receiver.response.body = JSON.generate(errors: "Synthetic response lost; retry to confirm the request")
      end
    end
    open_preparation(owner, 1440)
    within_consultant(employment) do
      click_button "Request profile completion"
      expect(page).to have_text("Synthetic response lost; retry to confirm the request")
      expect(page).to have_button("Request profile completion", disabled: false)
      expect(PayrollProfileCompletionRequest.count).to eq(1)
      first_id = PayrollProfileCompletionRequest.sole.id
      click_button "Request profile completion"
      expect(page).to have_text("Request email queued")
      expect(PayrollProfileCompletionRequest.sole.id).to eq(first_id)
    end
    expect(request_commands.size).to eq(2)
    expect(request_commands.map { |command| command.fetch("idempotency_key") }.uniq.size).to eq(1)
    expect(request_commands.map { |command| command.fetch("expected_digest") }.uniq.size).to eq(1)
    expect(run.reload.current_revision).to be_nil
  end
end
