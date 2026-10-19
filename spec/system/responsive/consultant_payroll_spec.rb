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
