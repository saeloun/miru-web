# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Consultant payroll source warnings", type: :system, js: true do
  let(:company) { create(:company, base_currency: "INR", timezone: "Asia/Kolkata") }
  let(:admin) { create(:user, current_workspace: company) }
  let(:consultant) { create(:user, current_workspace: company) }

  before do
    travel_to Time.zone.local(2026, 10, 19, 12)
    enable_synthetic_payroll(company.id)
    create(:employment, company:, user: admin, joined_at: "2026-01-01", resigned_at: nil)
    employment = create(:employment, company:, user: consultant, joined_at: "2026-01-01", resigned_at: nil)
    admin.add_role(:admin, company)
    consultant.add_role(:employee, company)
    employment.consultant_compensations.create!(created_by: admin, effective_on: "2026-09-01",
      monthly_fee: "100000", hours_per_day: "8", weekdays: [1, 2, 3, 4, 5],
      payment_source: "india", legal_entity_name: "Synthetic India entity", change_reason: "Agreed terms")
    project = create(:project, client: create(:client, company:))
    work = create(:timesheet_entry, project:, user: consultant, work_date: "2026-09-03", duration: 60, review_status: :approved)
    work.update_columns(duration: Float::NAN)
    leave_type = create(:leave_type, leave: create(:leave, company:, year: 2026))
    leave = create(:timeoff_entry, user: consultant, leave_type:, duration: 60, leave_date: "2026-09-04")
    leave.update_columns(duration: -60)
    claim = create(:expense, company:, user: consultant, currency: "INR", amount: 5000, date: "2026-09-10")
    claim.approve!
    claim.update_column(:amount, BigDecimal("NaN"))
  end

  after { travel_back }

  it "keeps long legal entities and large fees inside narrow review and history dialogs" do
    employment = consultant.employments.find_by!(company:)
    employment.consultant_compensations.create!(created_by: admin, effective_on: "2026-09-01",
      monthly_fee: "9999999999.99", hours_per_day: "8", weekdays: [1, 2, 3, 4, 5],
      payment_source: "india", legal_entity_name: "Legal" * 40, change_reason: "Reviewed terms")
    with_forgery_protection do
      sign_in(admin)
      [320, 375].each do |width|
        page.current_window.resize_to(width, 812)
        visit "/consultant-payroll"
        ["Review #{consultant.full_name}", "Terms history"].each do |label|
          click_button label
          expect(page).to have_css("[role='dialog']")
          expect(page.evaluate_script(<<~JS)).to be(true)
            (() => {
              const dialog = document.querySelector('[role="dialog"]');
              const values = Array.from(dialog.querySelectorAll('dl dd'));
              return dialog.scrollWidth <= dialog.clientWidth + 1 && document.documentElement.scrollWidth <= window.innerWidth + 1 && values.every(value => {
                const range = document.createRange();
                range.selectNodeContents(value);
                return range.getClientRects().length === 1;
              });
            })()
          JS
          click_button "Close"
          expect(page).not_to have_css("[role='dialog']")
        end
      end
    end
  end

  it "returns keyboard focus to the opening control after each consultant dialog closes" do
    sign_in(admin)
    with_forgery_protection do
      visit "/consultant-payroll"
      expect(page).to have_css("tbody tr", count: 1)
      ["Add consultant terms", "Review #{consultant.full_name}", "Terms history"].each do |label|
        click_button label
        expect(page).to have_css("[role='dialog']")
        find_button("Close").send_keys(:escape)
        expect(page).not_to have_css("[role='dialog']")
        expect(page).to have_css("button:focus", text: label, exact_text: true)
      end
    end
  end

  it "explains conflicting holiday dates and withholds a fee estimate after recalculation" do
    calendar = create(:holiday, company:, year: 2026, holiday_types: ["national", "optional"])
    holiday = create(:holiday_info, holiday: calendar, date: "2026-09-03", category: :optional)
    create(:timeoff_entry, user: consultant, leave_type: nil, holiday_info: holiday, leave_date: holiday.date)
    holiday.update!(date: "2026-09-04")
    sign_in(admin)
    with_forgery_protection do
      visit "/consultant-payroll"
      click_button "Review #{consultant.full_name}"
      within("[role='dialog']") do
        expect(page).to have_content("Selected holiday dates differ from recorded leave dates.")
        fill_in "Confirmed unpaid hours", with: "8"
        fill_in "Unpaid-hours decision / reason", with: "Reviewed unpaid absence"
        expect(page).to have_css("[role='status']", text: "Inputs changed.")
        click_button "Recalculate preview"
        expect(page).not_to have_css("[role='status']", text: "Inputs changed.")
        expect(page).to have_button("Recalculate preview", disabled: false)
        expect(page).not_to have_css("[role='alert']")
        expect(find("dt", text: "Expected hours", exact_text: true).find(:xpath, "following-sibling::dd[1]")).to have_text("—", exact: true)
        expect(find("dt", text: "Fee estimate (INR)", exact_text: true).find(:xpath, "following-sibling::dd[1]")).to have_text("—", exact: true)
        expect(page).to have_content("Reconcile the dates before estimating fees; source records were not changed.")
      end
    end
  end

  it "renders unavailable work and leave totals with actionable warnings instead of NaN or blank fields" do
    sign_in(admin)
    with_forgery_protection do
      visit "/consultant-payroll"
      expect(page).to have_css("tbody tr", count: 1)
      expect(page).to have_css("tbody td", text: "—", exact_text: true, count: 2)
      click_button "Review #{consultant.full_name}"
      within("[role='dialog']") do
        expect(page).to have_content("Work entries contain invalid durations.")
        expect(page).to have_content("Leave entries contain invalid durations.")
        expect(page).to have_content("No unpaid deduction was inferred.")
        expect(page).to have_content("1 claim(s) have an invalid reimbursement amount. Review the original claims.")
        expect(page).not_to have_css("input[type='checkbox']")
        expect(page).to have_css("dd", text: "—", exact_text: true, minimum: 1)
        expect(page).not_to have_content("NaN")
        expect(page).not_to have_content("Infinity")
      end
    end
  end
end
