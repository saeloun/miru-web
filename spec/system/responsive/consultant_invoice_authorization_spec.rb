# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Consultant invoice authorization", type: :system, js: true do
  let(:company) { create(:company, name: "Synthetic Consultancy") }
  let(:consultant) { create(:user, current_workspace: company) }
  let(:admin) { create(:user, current_workspace: company) }
  let!(:employment) { create(:employment, company:, user: consultant, joined_at: "2026-01-01", resigned_at: nil) }
  let!(:admin_employment) { create(:employment, company:, user: admin, joined_at: "2026-01-01", resigned_at: nil) }
  let(:console_errors) { [] }
  let(:service) { Payroll::InvoiceAuthorization.new(employment, actor: consultant) }

  around { |example| travel_to(Time.utc(2026, 11, 9, 12)) { with_forgery_protection { example.run } } }

  before do
    consultant.add_role(:employee, company)
    admin.add_role(:admin, company)
    allow(ENV).to receive(:[]).and_call_original
    allow(ENV).to receive(:[]).with("MIRU_PAYROLL_ENABLED").and_return("true")
    allow(ENV).to receive(:[]).with("MIRU_PAYROLL_SAELOUN_COMPANY_ID").and_return(company.id.to_s)
    ConsultantCompensation.create!(employment:, created_by: admin, effective_on: "2026-01-01", monthly_fee: "50000",
      hours_per_day: "8", weekdays: [1, 2, 3, 4, 5], payment_source: "india", legal_entity_name: "Synthetic India entity",
      change_reason: "Synthetic consultant engagement")
  end

  after { expect(console_errors).to eq([]) }

  def sign_in_at_width(actor, width)
    sign_in(actor)
    page.current_window.resize_to(width, 1000)
    expect(page.evaluate_script("window.innerWidth")).to eq(width)
    page.driver.browser.on("Runtime.consoleAPICalled") { |event| console_errors << event if event["type"] == "error" }
    page.driver.browser.on("Runtime.exceptionThrown") { |event| console_errors << event }
  end

  def open_self(width = 1440)
    sign_in_at_width(consultant, width)
    visit "/settings/invoice-authorization"
    expect(page).to have_css("h2", text: "Invoice authorization", exact_text: true)
    expect(page).to have_css("p[role='status']", text: /\A(?:Authorization (?:not granted|granted|withdrawn)|Reauthorization required)\z/)
  end

  def press(name)
    control = find_button(name, exact: true)
    page.scroll_to(control, align: :center)
    control.click
  end

  def grant
    check "I have read and agree to this authorization."
    press "Grant invoice authorization"
    expect(page).to have_text("Authorization granted")
  end

  def record(action)
    summary = service.summary.deep_symbolize_keys
    service.record!(action:, expected_event_id: summary.dig(:current_event, :id).to_s,
      statement_digest: summary.dig(:statement, :digest), idempotency_key: SecureRandom.uuid)
  end

  def lose_next_response
    lose_response = true
    allow_any_instance_of(Api::V1::ConsultantInvoiceAuthorizationsController).to receive(:render).and_wrap_original do |original, *arguments, **options|
      if original.receiver.action_name == "create" && lose_response
        lose_response = false
        original.call(json: { errors: "Synthetic response lost after commit" }, status: 503)
      else
        original.call(*arguments, **options)
      end
    end
  end

  def capture(name, width)
    return unless ENV["INVOICE_AUTHORIZATION_SHOTS"]

    expect(page.evaluate_script("window.innerWidth")).to eq(width)
    expect(page.evaluate_script("document.documentElement.scrollWidth <= window.innerWidth")).to be(true)
    page.scroll_to(find("h2", text: "Invoice authorization", exact_text: true), align: :top)
    area = page.evaluate_script("({ x: window.scrollX, y: window.scrollY, width: window.innerWidth, height: window.innerHeight })")
    FileUtils.mkdir_p(ENV.fetch("INVOICE_AUTHORIZATION_SHOTS"))
    page.save_screenshot(File.join(ENV.fetch("INVOICE_AUTHORIZATION_SHOTS"), "#{name}-#{width}.png"), area:)
  end

  [1440, 375].each do |width|
    it "requires explicit self consent and retains grant, withdrawal and regrant receipts at #{width}px" do
      open_self(width)
      expect(page).to have_unchecked_field("I have read and agree to this authorization.")
      expect(page).to have_button("Grant invoice authorization", disabled: true)
      expect(ConsultantInvoiceAuthorization.count).to eq(0)
      capture("not-granted", width)
      grant
      expect(page).to have_css("[data-testid^='authorization-event-']", count: 1)
      press "Withdraw invoice authorization"
      expect(page).to have_text("Authorization withdrawn")
      expect(page).to have_unchecked_field("I have read and agree to this authorization.")
      expect(page).to have_button("Grant invoice authorization", disabled: true)
      capture("withdrawn", width)
      grant
      expect(ConsultantInvoiceAuthorization.where(employment:).order(:id).pluck(:action)).to eq(%w[grant withdraw grant])
      expect(page).to have_css("[data-testid^='authorization-event-']", count: 3)
      capture("granted-history", width)
    end
  end

  it "shows an admin read-only status without proxy grant or withdrawal controls" do
    open_self
    grant
    sign_in_at_width(admin, 1440)
    visit "/team/#{consultant.id}/employee-records?company_id=#{company.id}"
    expect(page).to have_text("Authorization granted")
    expect(page).to have_no_button("Grant invoice authorization")
    expect(page).to have_no_button("Withdraw invoice authorization")
    expect(page).to have_no_field("I have read and agree to this authorization.")
    expect(ConsultantInvoiceAuthorization.count).to eq(1)
    capture("admin-read-only", 1440)
  end

  it "lets an exited consultant withdraw from the self settings route without allowing a new grant" do
    open_self(375)
    grant
    employment.update!(resigned_at: Date.yesterday)
    open_self(375)
    expect(page).to have_button("Withdraw invoice authorization")
    expect(page).to have_no_button("Grant invoice authorization")
    allow(ENV).to receive(:[]).with("MIRU_PAYROLL_ENABLED").and_return("false")
    press "Refresh authorization"
    expect(page).to have_button("Withdraw invoice authorization")
    expect(page).to have_no_button("Grant invoice authorization")
    press "Withdraw invoice authorization"
    expect(page).to have_text("Authorization withdrawn")
    expect(page).to have_no_button("Grant invoice authorization")
    expect(ConsultantInvoiceAuthorization.where(employment:).order(:id).pluck(:action)).to eq(%w[grant withdraw])
    capture("post-exit-withdrawn", 375)
  end

  it "lets assigned accounts read authorization without granting coworker employee-record access" do
    open_self
    grant
    accounts = create(:user, current_workspace: company)
    owner = create(:user, current_workspace: company)
    [accounts, owner].each { |actor| create(:employment, company:, user: actor, joined_at: "2026-01-01", resigned_at: nil) }
    accounts.add_role(:book_keeper, company)
    owner.add_role(:owner, company)
    run = PayrollRun.create!(company:, period: Date.current.beginning_of_month, currency: "INR", accounts_reviewer: accounts, final_reviewer: owner)
    expect(EmployeeRecordPolicy.new(accounts, employment).show?).to be(false)
    sign_in_at_width(accounts, 1440)
    visit "/payroll/#{run.id}"
    link = find_link("Invoice authorization", href: "/settings/invoice-authorization?user_id=#{consultant.id}")
    page.scroll_to(link, align: :center)
    link.click
    expect(page).to have_text(consultant.full_name)
    expect(page).to have_text("Authorization granted")
    expect(page).to have_no_button("Grant invoice authorization")
    expect(page).to have_no_button("Withdraw invoice authorization")
    expect(ConsultantInvoiceAuthorization.count).to eq(1)
  end

  it "requires a refresh after a stale predecessor instead of silently granting against a different receipt" do
    open_self
    record("grant")
    check "I have read and agree to this authorization."
    press "Grant invoice authorization"
    expect(page).to have_text("Refresh authorization before another change.")
    expect(page).to have_button("Grant invoice authorization", disabled: true)
    expect(ConsultantInvoiceAuthorization.count).to eq(1)
    press "Refresh authorization"
    expect(page).to have_text("Authorization granted")
    expect(page).to have_button("Withdraw invoice authorization")
  end

  it "retries a committed grant with the original command after a lost response and explicit refresh" do
    lose_next_response
    open_self
    check "I have read and agree to this authorization."
    press "Grant invoice authorization"
    expect(page).to have_text("Synthetic response lost after commit")
    original = ConsultantInvoiceAuthorization.sole
    press "Refresh authorization"
    expect(page).to have_text("Authorization granted")
    press "Retry previous grant"
    expect(page).to have_no_button("Retry previous grant")
    expect(ConsultantInvoiceAuthorization.count).to eq(1)
    expect(ConsultantInvoiceAuthorization.sole.id).to eq(original.id)
  end

  it "confirms an older lost grant without reactivating permission withdrawn by a newer command" do
    lose_next_response
    open_self
    check "I have read and agree to this authorization."
    press "Grant invoice authorization"
    expect(page).to have_text("Synthetic response lost after commit")
    record("withdraw")
    press "Refresh authorization"
    expect(page).to have_text("Authorization withdrawn")
    press "Retry previous grant"
    expect(page).to have_text("Earlier grant confirmed. The current authorization was not changed.")
    expect(page).to have_text("Authorization withdrawn")
    expect(ConsultantInvoiceAuthorization.where(employment:).order(:id).pluck(:action)).to eq(%w[grant withdraw])
  end

  it "requires a new affirmation when refreshed wording changes during an uncommitted ambiguous grant" do
    reject_before_commit = true
    allow_any_instance_of(Api::V1::ConsultantInvoiceAuthorizationsController).to receive(:create).and_wrap_original do |original, *arguments, **options|
      if reject_before_commit
        reject_before_commit = false
        original.receiver.send(:authorize, original.receiver.send(:employment), :record?, policy_class: ConsultantInvoiceAuthorizationPolicy)
        original.receiver.render(json: { errors: "Synthetic unavailable response before commit" }, status: 503)
      else
        original.call(*arguments, **options)
      end
    end
    open_self
    check "I have read and agree to this authorization."
    press "Grant invoice authorization"
    expect(page).to have_text("Synthetic unavailable response before commit")
    expect(ConsultantInvoiceAuthorization.count).to eq(0)
    updated_text = "I authorize Miru to generate invoices only for my consultancy services in this workspace. I can withdraw permission for future invoices."
    stub_const("Payroll::InvoiceAuthorization::STATEMENT_VERSION", "synthetic-invoice-authorization-v2")
    stub_const("Payroll::InvoiceAuthorization::STATEMENT_TEXT", updated_text)
    press "Refresh authorization"
    expect(page).to have_text(updated_text)
    expect(page).to have_unchecked_field("I have read and agree to this authorization.")
    press "Retry previous grant"
    expect(page).to have_no_button("Retry previous grant")
    expect(page).to have_text("Refresh authorization before another change.")
    expect(page).to have_button("Grant invoice authorization", disabled: true)
    expect(ConsultantInvoiceAuthorization.count).to eq(0)
    press "Refresh authorization"
    expect(page).to have_unchecked_field("I have read and agree to this authorization.")
    expect(page).to have_button("Grant invoice authorization", disabled: true)
    grant
    expect(ConsultantInvoiceAuthorization.sole.statement_version).to eq("synthetic-invoice-authorization-v2")
  end

  it "loads older immutable receipts without duplicating the current history" do
    11.times { record("grant"); record("withdraw") }
    open_self
    expect(page).to have_css("[data-testid^='authorization-event-']", count: 20)
    press "Load older receipts"
    expect(page).to have_css("[data-testid^='authorization-event-']", count: 22)
    expect(page).to have_no_button("Load older receipts")
  end
end
