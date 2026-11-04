# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Invoice address layout", type: :system, js: true do
  let(:company) do
    create(:india_company, base_currency: "INR",
      name: "SyntheticConsultingEngineering")
  end
  let(:admin) { create(:user, current_workspace: company) }
  let(:client) do
    create(:client, company:, currency: "INR", name: "Synthetic billing client",
      legal_name: "Synthetic Client International Development and Professional Consulting Services Private Limited",
      ein: "12-3456789")
  end
  let(:invoice) do
    create(:invoice, company:, client:, currency: "INR", invoice_number: "LAYOUT-001", status: "sent",
      amount: 1000, amount_due: 1000, amount_paid: 0)
  end
  let(:console_errors) { [] }

  before do
    stub_request(:get, %r{\Ahttps://api\.pwnedpasswords\.com/range/}).to_return(status: 200, body: "")
    create(:employment, company:, user: admin)
    admin.add_role(:admin, company)
    company.addresses.first.update!(address_line_1: "SyntheticCorporateRegistrationAndConsultingCentre",
      address_line_2: "Suite 401, East Wing, International Business Park", city: "Pune", state: "Maharashtra", country: "IN", pin: "411001")
    client.addresses.first.update!(address_line_1: "SyntheticClientBillingAndProcurementServicesCentre",
      address_line_2: nil, city: "Bengaluru", state: "Karnataka", country: "IN", pin: "560001")
    create(:invoice_line_item, invoice:, name: "Consulting services", description: "Consulting services",
      date: invoice.issue_date, rate: 1000, quantity: 60, timesheet_entry: nil)
    browser = page.driver.browser.page
    browser.command("Log.enable")
    browser.on("Runtime.consoleAPICalled") do |event|
      console_errors << event["args"].map { |arg| arg["value"] || arg["description"] }.join(" ") if event["type"] == "error"
    end
    browser.on("Log.entryAdded") do |event|
      entry = event["entry"]
      console_errors << "#{entry["text"]} #{entry["url"]}" if entry["level"] == "error" && entry["url"].to_s.include?("localhost")
    end
    browser.on("Runtime.exceptionThrown") do |event|
      console_errors << event.dig("exceptionDetails", "text")
    end
  end

  after { expect(console_errors).to eq([]) }

  # Regression: invoice headers and billing cards clipped long addresses or omitted mobile billing details.
  # Found by /qa on 2026-11-04; report: output/playwright/invoice-address-layout-20261104/qa-report.md
  ["public", "client", "admin", "pro_admin"].each do |role|
    it "shows complete company and billing details for #{role} invoices" do
      company.update!(plan_tier: "paid") if role == "pro_admin"
      if role == "client"
        user = create(:user, current_workspace: company)
        create(:employment, company:, user:)
        create(:client_member, company:, client:, user:)
        user.add_role(:client, company)
        sign_in(user)
      elsif role.end_with?("admin")
        sign_in(admin)
      end
      path = role.end_with?("admin") ? "/invoices/#{invoice.id}" : "/invoices/#{invoice.external_view_key}"
      path += "/view" if role == "public"

      aggregate_failures do
        [1400, 390].each do |width|
          page.driver.resize(width, 1000)
          with_forgery_protection { visit path }
          expect(page).to have_content("LAYOUT-001", wait: 15)
          expect(page).to have_content(company.name)
          expect(page).to have_no_text(/client analytics/i) if role == "admin"
          expect(page).to have_text(/client analytics/i) if role == "pro_admin"
          save_layout_shot(role, width)
          [company.name, company.addresses.first.address_line_1, client.legal_name,
            client.addresses.first.address_line_1, client.ein].each do |text|
            expect(page).to have_content(text)
            expect(text_overflow(text)).to eq([]), "#{role} at #{width}px clips #{text}"
          end
          expect(page.evaluate_script("document.documentElement.scrollWidth <= window.innerWidth")).to be(true)
        end
      end
    end
  end

  it "keeps mobile line-item labels readable and paired with their values" do
    page.driver.resize(390, 1000)
    with_forgery_protection { visit "/invoices/#{invoice.external_view_key}/view" }
    expect(page).to have_content("LAYOUT-001", wait: 15)
    save_layout_shot("line-items", 390)

    { "Date" => invoice.issue_date.strftime("%d-%m-%Y"), "Rate" => "₹1,000.00",
      "Quantity" => "01:00", "Total" => "₹1,000.00" }.each do |label, value|
      term = find("dt", exact_text: label)
      expect(term.find(:xpath, "following-sibling::dd[1]")).to have_text(value, exact: true)
      expect(text_overflow(label)).to eq([]), "mobile invoice clips #{label}"
    end
  end

  it "preserves waived totals and disables payment on mobile" do
    invoice.update!(status: "waived", amount_due: 0)
    page.driver.resize(390, 1000)
    with_forgery_protection { visit "/invoices/#{invoice.external_view_key}/view" }

    expect(page).to have_text(/waived/i, wait: 15)
    expect(page).to have_button("PAY", disabled: true)
    total = find("dt", exact_text: "Total").find(:xpath, "following-sibling::dd[1]")
    rate = find("dt", exact_text: "Rate").find(:xpath, "following-sibling::dd[1]")
    expect(total[:class]).to include("line-through")
    expect(rate[:class]).not_to include("line-through")
    save_layout_shot("waived-line-items", 390)
  end

  def text_overflow(text)
    page.evaluate_script(<<~JS)
      (() => {
        const element = [...document.querySelectorAll('p, h1, h2, h3, span, th, dt')].reverse().find(p =>
          p.textContent.toLowerCase().includes(#{text.downcase.to_json}) && p.getBoundingClientRect().height > 0);
        if (!element) return ['missing text'];
        const range = document.createRange();
        range.selectNodeContents(element);
        const textRect = range.getBoundingClientRect();
        const elementRect = element.getBoundingClientRect();
        if (textRect.right > elementRect.right + 2 || textRect.left < elementRect.left - 2)
          return ['text exceeds its own element'];
        const overflow = [];
        let parent = element.parentElement;
        for (let depth = 0; parent && depth < 3; depth++, parent = parent.parentElement) {
          const rect = parent.getBoundingClientRect();
          if (textRect.right > rect.right + 2 || textRect.left < rect.left - 2 || textRect.bottom > rect.bottom + 2)
            overflow.push(parent.className);
        }
        return overflow;
      })()
    JS
  end

  def save_layout_shot(role, width)
    return if ENV["INVOICE_LAYOUT_SHOTS"].blank?

    directory = File.expand_path(ENV["INVOICE_LAYOUT_SHOTS"], Rails.root)
    FileUtils.mkdir_p(directory)
    page.save_screenshot(File.join(directory, "#{role}-#{width}.png"), full: true)
  end
end
