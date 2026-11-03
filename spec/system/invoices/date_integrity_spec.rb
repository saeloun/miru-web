# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Invoice calendar dates", type: :system, js: true do
  let(:company) { create(:india_company, name: "Synthetic date checks", base_currency: "INR") }
  let(:user) { create(:user, current_workspace: company, locale: "en-US") }
  let(:client) { create(:client, company:, currency: "INR") }
  let(:invoice) do
    create(:invoice, company:, client:, status: "draft", currency: "INR", invoice_number: "DATE-001",
      issue_date: Date.new(2025, 8, 23), due_date: Date.new(2025, 9, 6),
      amount: 1000, amount_due: 1000, amount_paid: 0)
  end
  let(:console_errors) { [] }

  before do
    stub_request(:get, %r{\Ahttps://api\.pwnedpasswords\.com/range/}).to_return(status: 200, body: "")
    create(:employment, company:, user:)
    user.add_role(:admin, company)
    create(:invoice_line_item, invoice:, date: Date.new(2025, 7, 8), name: "Calendar-safe consulting",
      description: "Synthetic date check", rate: 1000, quantity: 60, timesheet_entry: nil)
    sign_in(user)
    browser = page.driver.browser.page
    browser.on("Runtime.consoleAPICalled") do |event|
      console_errors << event["args"].map { |arg| arg["value"] || arg["description"] }.join(" ") if event["type"] == "error"
    end
    browser.on("Runtime.exceptionThrown") { |event| console_errors << event.dig("exceptionDetails", "text") }
  end

  after do
    page.driver.browser.page.command("Emulation.setTimezoneOverride", timezoneId: "")
    expect(console_errors).to eq([])
  end

  # Regression: formatted invoice dates disappeared/swapped; ISO line-item dates shifted in western timezones.
  # Found by /qa on 2026-11-04; report: output/playwright/invoice-date-integrity-20261104/qa-report.md
  ["DD-MM-YYYY", "MM-DD-YYYY", "YYYY-MM-DD"].product(["Asia/Kolkata", "America/Los_Angeles"]).each do |date_format, timezone|
    it "preserves #{date_format} dates in #{timezone} through preview and edit/save" do
      company.update!(date_format:)
      page.driver.browser.page.command("Emulation.setTimezoneOverride", timezoneId: timezone)

      with_forgery_protection do
        visit "/invoices"
        within("[data-testid='invoice-row-#{invoice.id}']") do
          expect(page).to have_text("Aug 23, 2025")
          expect(page).to have_text("Sep 6, 2025")
        end
        visit "/invoices/#{invoice.id}"
        expect(page).to have_css("[data-testid='invoice-preview']", wait: 15)
        save_date_shot(date_format, timezone, "preview")
        within("[data-testid='invoice-preview']") do
          expect(page).to have_text("Aug 23, 2025")
          expect(page).to have_text("Sep 06, 2025")
          expect(page).to have_text("Jul 08, 2025")
        end
        visit_invoice_editor(invoice)
        expect(page).to have_button("August 23rd, 2025")
        expect(page).to have_button("September 6th, 2025")
        fill_in "reference", with: "DATE-EDIT"
        save_invoice
        expect(last_invoice_mutation_response&.fetch("status")).to eq(200), last_invoice_mutation_response&.fetch("body")
        request_invoice = parsed_last_invoice_mutation_request_body.fetch("invoice")
        expect(request_invoice.values_at("issue_date", "due_date"))
          .to eq(["2025-08-23", "2025-09-06"])
        expect(request_invoice.fetch("invoice_line_items_attributes").first.fetch("date")).to eq("2025-07-08")
        expect(invoice.reload).to have_attributes(issue_date: Date.new(2025, 8, 23), due_date: Date.new(2025, 9, 6))
        expect(invoice.invoice_line_items.first.reload.date).to eq(Date.new(2025, 7, 8))
      end
    end
  end

  def save_date_shot(date_format, timezone, state)
    return if ENV["INVOICE_DATE_SHOTS"].blank?

    directory = File.expand_path(ENV["INVOICE_DATE_SHOTS"], Rails.root)
    FileUtils.mkdir_p(directory)
    name = "#{date_format}-#{timezone.tr('/', '-')}-#{state}.png"
    page.save_screenshot(File.join(directory, name), full: true)
  end
end
