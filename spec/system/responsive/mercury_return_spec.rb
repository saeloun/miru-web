# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Returned Mercury payroll transfers", type: :system, js: true do
  include_context "reviewed mercury consultant payroll"

  let(:service) { Payroll::MercuryReconciliation.new(run) }
  let(:console_errors) { [] }
  let(:transactions_url) { %r{#{Regexp.escape(mercury_base)}/account/#{account_id}/transactions} }

  before do
    @leg = accepted_instruction
    stub_request(:get, "#{mercury_base}/request-send-money/#{request_id}")
      .to_return(mercury_json(mercury_request("status" => "approved")))
    stub_transaction("sent")
    service.refresh!(actor: owner, instruction_id: @leg.id)
    service.record_credit!(actor: accounts, instruction_id: @leg.id, amount: "62000.00",
      credited_on: company.resolved_time_zone.today.iso8601, reference: "SYNTHETIC-CREDIT")
    stub_transaction("reversed")
    service.refresh!(actor: owner, instruction_id: @leg.id)
    stub_transaction("sent")
    sign_in(owner)

    browser = page.driver.browser.page
    browser.on("Runtime.consoleAPICalled") do |event|
      console_errors << event["args"].map { |arg| arg["value"] || arg["description"] }.join(" ") if event["type"] == "error"
    end
    browser.on("Runtime.exceptionThrown") { |event| console_errors << event.dig("exceptionDetails", "text") }
  end

  after { expect(console_errors).to eq([]) }

  it "retains the return and hides credit actions after bank refresh on desktop and mobile" do
    with_forgery_protection do
      [1400, 390].each_with_index do |width, index|
        page.driver.resize(width, 1000)
        visit "/payroll/#{run.id}"
        expect(page).to have_text("This wire came back.", wait: 15)
        click_button "Refresh bank status"
        page.document.synchronize(5, errors: [RSpec::Expectations::ExpectationNotMetError]) do
          expect(a_request(:get, transactions_url)).to have_been_made.times(3 + index)
        end
        expect(page).to have_button("Refresh bank status", disabled: false)
        expect(page).to have_text("Returned")
        expect(page).to have_text("This wire came back.")
        expect(page).to have_no_button("Record credit")
        expect(page).to have_no_button("Resolve shortfall")
        expect(@leg.reload.transaction_status).to eq("reversed")
        expect(@leg.credited_minor).to eq(6_200_000)
        expect(@leg.payroll_payment_group.reload.fully_credited_at).to be_nil
        expect(page.evaluate_script("document.documentElement.scrollWidth <= window.innerWidth")).to be(true)
        save_return_shot(width)
      end
    end
  end

  it "requests a spouse split with explicit country and currency while retaining the returned transfer" do
    with_forgery_protection do
      page.driver.resize(1440, 1000)
      visit "/payroll/#{run.id}"
      expect(page).to have_text("This wire came back.")
      click_button "Add spouse split"
      expect(page).to have_field("Bank country code (e.g. IN)", with: "")
      expect(page).to have_field("Account currency (e.g. INR)", with: "")
      expect(find_field("Bank branch (optional)")[:required]).to be(false)
      fill_in "Value", with: "25"
      fill_in "Spouse legal name (account holder)", with: "Synthetic Spouse"
      fill_in "Bank name", with: "Synthetic Spouse Bank"
      fill_in "Bank country code (e.g. IN)", with: "in"
      fill_in "Account currency (e.g. INR)", with: "inr"
      expect(page).to have_field("Bank country code (e.g. IN)", with: "IN")
      expect(page).to have_field("Account currency (e.g. INR)", with: "INR")
      fill_in "Account number", with: "000011112222", exact: true
      fill_in "Confirm account number", with: "000011112222"
      fill_in "IFSC", with: "SPOU0000002"
      fill_in "SWIFT", with: "SPOUINBBXXX"
      page.scroll_to(find_field("Bank country code (e.g. IN)"), align: :center)
      save_return_shot(1440, prefix: "spouse-split-form", full: false)
      click_button "Request split"
      expect(page).to have_text("Declared bank country: IN; account currency: INR")
      expect(page).to have_no_field("Account number", exact: true)
      arrangement = PayrollSplitArrangement.current_for(employment)
      expect(arrangement.details).to include("bank_account_number" => "000011112222", "bank_country" => "IN", "bank_account_currency" => "INR", "bank_branch" => "")
      expect(arrangement.bank_details).not_to have_key("bank_branch")
      expect(@leg.reload.transaction_status).to eq("reversed")
      expect(@leg.credited_minor).to eq(6_200_000)
      [1440, 375].each do |width|
        page.driver.resize(width, 1000)
        visit "/payroll/#{run.id}"
        expect(page.evaluate_script("window.innerWidth")).to eq(width)
        expect(page).to have_text("Declared bank country: IN; account currency: INR")
        expect(page).to have_no_text("000011112222")
        expect(page.evaluate_script("document.documentElement.scrollWidth <= window.innerWidth")).to be(true)
        page.scroll_to(find("h4", text: "Spouse split", exact_text: true), align: :center)
        save_return_shot(width, prefix: "spouse-split-requested", full: false)
      end
    end
  end

  def stub_transaction(status)
    stub_request(:get, transactions_url)
      .to_return(mercury_json({ "total" => 1, "transactions" => [mercury_transaction("status" => status)] }))
  end

  # Writes opt-in QA images; scroll-aware viewport coordinates prevent blank captures after scrolling.
  def save_return_shot(width, prefix: "returned-after-refresh", full: true)
    return if ENV["MERCURY_RETURN_SHOTS"].blank?

    directory = File.expand_path(ENV["MERCURY_RETURN_SHOTS"], Rails.root)
    FileUtils.mkdir_p(directory)
    options = full ? { full: true } : { area: page.evaluate_script("({ x: window.scrollX, y: window.scrollY, width: window.innerWidth, height: window.innerHeight })") }
    page.save_screenshot(File.join(directory, "#{prefix}-#{width}.png"), **options)
  end
end
