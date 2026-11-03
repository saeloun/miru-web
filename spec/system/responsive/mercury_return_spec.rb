# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Returned Mercury payroll transfers", type: :system, js: true do
  include_context "approved mercury consultant payroll"

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

  def stub_transaction(status)
    stub_request(:get, transactions_url)
      .to_return(mercury_json({ "total" => 1, "transactions" => [mercury_transaction("status" => status)] }))
  end

  def save_return_shot(width)
    return if ENV["MERCURY_RETURN_SHOTS"].blank?

    directory = File.expand_path(ENV["MERCURY_RETURN_SHOTS"], Rails.root)
    FileUtils.mkdir_p(directory)
    page.save_screenshot(File.join(directory, "returned-after-refresh-#{width}.png"), full: true)
  end
end
