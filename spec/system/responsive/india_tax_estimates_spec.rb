# frozen_string_literal: true

require "rails_helper"

RSpec.describe "India tax estimates", type: :system, js: true do
  let(:company) { create(:company, base_currency: "INR", timezone: "Asia/Kolkata") }
  let(:employee) { create(:user, current_workspace: company) }

  before do
    enable_synthetic_payroll(company.id)
    create(:employment, company:, user: employee, joined_at: "2026-01-01", resigned_at: nil)
    employee.add_role(:employee, company)
    page.driver.browser.evaluate_on_new_document(<<~JS)
      (() => {
        if (window.__indiaTaxErrors) return;
        window.__indiaTaxErrors = [];
        const originalError = console.error;
        console.error = (...args) => {
          window.__indiaTaxErrors.push(args.map(String).join(' '));
          originalError.apply(console, args);
        };
        window.addEventListener('error', event => window.__indiaTaxErrors.push(event.message));
        window.addEventListener('unhandledrejection', event => window.__indiaTaxErrors.push(String(event.reason)));
      })();
    JS
    with_forgery_protection { sign_in employee }
  end

  def confirm_profile
    check "I confirm this supported income profile"
    check "I confirm deduction eligibility and no duplicate claims"
  end

  def tax_value(regime)
    within("[data-regime='#{regime}']") do
      find("dt", text: "Annual income tax", exact_text: true).find(:xpath, "following-sibling::dd[1]").text.gsub(/[^\d.]/, "")
    end
  end

  it "compares both statutory periods and discards stale results when inputs change" do
    with_forgery_protection do
      visit "/tax-declarations"
      click_link "Estimate annual tax"
      expect(page).to have_current_path("/india-tax")
      fill_in "Annual gross salary (INR)", with: "1275000"
      confirm_profile
      click_button "Compare tax regimes"
      expect(page).to have_css("[aria-label='Tax comparison']")
      expect(tax_value("new")).to eq("0.00")
      expect(tax_value("old")).to eq("187200.00")
      expect(page).to have_text("Income-tax Act, 2025")
      page.save_screenshot(Rails.root.join("tmp/screenshots/india-tax-2026.png"), full: true)

      find("#india-tax-year").click
      find("[role='option']", text: "FY 2025–26 / AY 2026–27", exact_text: true).click
      expect(page).not_to have_css("[aria-label='Tax comparison']")
      confirm_profile
      click_button "Compare tax regimes"
      expect(page).to have_text("Income-tax Act, 1961")
      expect(tax_value("new")).to eq("0.00")
      page.save_screenshot(Rails.root.join("tmp/screenshots/india-tax-2025.png"), full: true)

      fill_in "Annual gross salary (INR)", with: "1300000"
      expect(page).not_to have_css("[aria-label='Tax comparison']")
      page.save_screenshot(Rails.root.join("tmp/screenshots/india-tax-no-stale.png"), full: true)
      click_button "Compare tax regimes"
      expect(tax_value("new")).to eq("26000.00")
      invalid_request = page.evaluate_async_script(<<~JS)
        const done = arguments[0];
        fetch('/api/v1/india_tax_estimates', {
          method: 'POST',
          headers: {'Content-Type': 'application/json', 'X-CSRF-Token': document.querySelector('meta[name="csrf-token"]').content},
          body: JSON.stringify({tax_estimate: 'invalid'})
        }).then(async response => ({status: response.status, body: await response.json()}))
          .then(async result => ({...result, session: (await fetch('/api/v1/users/_me')).status}))
          .then(done);
      JS
      expect(invalid_request).to include("status" => 400, "session" => 200)
      expect(invalid_request.fetch("body")).not_to have_key("estimate")
      expect(page.evaluate_script("window.__indiaTaxErrors")).to eq([])
      expect(TaxDeclaration.count).to eq(0)
      expect(PayrollRun.count).to eq(0)
    end
  end

  it "shows capped deductions and separate employer pension limits in a contained mobile layout" do
    with_forgery_protection do
      page.current_window.resize_to(375, 812)
      visit "/india-tax"
      fill_in "Annual gross salary (INR)", with: "3000000"
      fill_in "Eligible investments and annuity (INR)", with: "120000"
      fill_in "Employee NPS in shared pool (INR)", with: "30000"
      fill_in "Additional personal NPS (INR)", with: "50000"
      fill_in "Total personal NPS paid (INR)", with: "80000"
      fill_in "Qualifying personal pension salary (INR)", with: "300000"
      fill_in "Professional tax paid (INR)", with: "2500"
      fill_in "Eligible family insurance premiums (INR)", with: "30000"
      fill_in "Eligible parent insurance premiums (INR)", with: "55000"
      check "An insured parent is a resident senior citizen"
      2.times { click_button "Add employer pension" }
      [1, 2].each do |number|
        fill_in "Employer #{number} pension contribution (INR)", with: "150000"
        fill_in "Employer #{number} qualifying salary (INR)", with: "1000000"
      end
      check "Employer 2 is Central or State Government"
      confirm_profile
      click_button "Compare tax regimes"
      expect(tax_value("old")).to eq("563940.00")
      expect(tax_value("new")).to eq("388440.00")
      expect(page).to have_text("123 / Schedule XV")
      expect(page.evaluate_script("document.documentElement.scrollWidth <= window.innerWidth + 1")).to be(true)
      page.save_screenshot(Rails.root.join("tmp/screenshots/india-tax-deductions-mobile.png"), full: true)
      page.current_window.resize_to(320, 812)
      expect(page.evaluate_script("document.documentElement.scrollWidth <= window.innerWidth + 1")).to be(true)
      expect(page.evaluate_script("window.__indiaTaxErrors")).to eq([])
    end
  end
end
