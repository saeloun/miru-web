# frozen_string_literal: true

require "rails_helper"
require "csv"

RSpec.describe EmployeeReports::DownloadService do
  let(:company) { create(:company, timezone: "Pacific Time (US & Canada)") }
  let(:user) { create(:user, current_workspace: company) }
  let(:employment) { create(:employment, company:, user:, resigned_at: nil, joined_at: Date.new(2020, 1, 1)) }
  let(:report) { EmployeeReport.create!(company:, name: "Sources", columns: EmployeeReports::Columns::DEFINITIONS.keys) }

  def row
    csv = described_class.new(report:, month: "2026-10", employments: Employment.where(id: employment.id)).process
    CSV.parse(csv, headers: true).first
  end

  it "uses company-scoped kept monthly time records and distinct working dates" do
    project = create(:project, company:)
    create(:timesheet_entry, project:, user:, work_date: "2026-10-01", duration: 60)
    create(:timesheet_entry, project:, user:, work_date: "2026-10-01", duration: 120)
    create(:timesheet_entry, project:, user:, work_date: "2026-09-30", duration: 480)
    create(:timesheet_entry, project:, user:, work_date: "2026-10-02", duration: 480, discarded_at: Time.current)
    create(:timesheet_entry, user:, work_date: "2026-10-03", duration: 480)
    leave = create(:leave, company:, year: 2026)
    leave_type = create(:leave_type, leave:)
    create(:timeoff_entry, user:, leave_type:, leave_date: "2026-10-01", duration: 240)
    create(:timeoff_entry, user:, leave_type:, leave_date: "2026-09-30", duration: 480)
    create(:timeoff_entry, user:, leave_type:, leave_date: "2026-10-02", duration: 480, discarded_at: Time.current)
    create(:timeoff_entry, user:, leave_date: "2026-10-03", duration: 480)
    expect(row.to_h).to include("Month recorded time off (minutes)" => "240", "Month recorded work (minutes)" => "180.0",
      "Month recorded working days" => "1", "Month calendar weekdays (Mon–Fri)" => "22")
  end

  it "separates approved unpaid from recorded paid personal reimbursements, preserving currencies and local month" do
    create(:expense, company:, user:, amount: 100, currency: "INR", expense_type: :personal, status: :paid,
      approved_at: Time.utc(2026, 10, 2), paid_at: Time.utc(2026, 11, 1, 6, 59))
    create(:expense, company:, user:, amount: 20, currency: "USD", expense_type: :personal, status: :paid,
      approved_at: Time.utc(2026, 10, 2), paid_at: Time.utc(2026, 10, 3))
    create(:expense, company:, user:, amount: 30, currency: "INR", expense_type: :personal, status: :approved,
      approved_at: Time.utc(2026, 10, 2))
    create(:expense, company:, user:, amount: 40, currency: "USD", expense_type: :personal, status: :submitted)
    create(:expense, company:, user:, amount: 50, currency: "USD", expense_type: :business, status: :paid,
      approved_at: Time.utc(2026, 10, 2), paid_at: Time.utc(2026, 10, 3))
    expect(row["Month recorded paid reimbursements by currency (JSON)"]).to eq('{"INR":"100.00","USD":"20.00"}')
    expect(row["Month approved unpaid reimbursements by currency (JSON)"]).to eq('{"INR":"30.00"}')
  end

  it "exports current encrypted facts, configured holidays and escapes spreadsheet formulas" do
    EmployeeRecord.create!(employment:, private_details: { "bank_account_name" => "\t=unsafe",
      "salary_amount" => "100.00", "salary_currency" => "INR" })
    holiday = create(:holiday, company:, year: 2026)
    create(:holiday_info, holiday:, date: "2026-10-02", category: :national)
    create(:holiday_info, holiday:, date: "2026-10-03", category: :optional)
    expect(row.to_h).to include("Bank account holder" => "'\t=unsafe", "Current salary amount" => "100.00",
      "Current salary currency" => "INR", "Month configured national holiday dates (JSON)" => '["2026-10-02"]')
  end

  it "bounds exports and rejects invalid month values" do
    stub_const("EmployeeReports::DownloadService::MAX_EMPLOYEES", 0)
    expect { row }.to raise_error(ArgumentError, /exceeds/)
    expect { described_class.new(report:, month: "2026-1", employments: Employment.all) }.to raise_error(ArgumentError, /YYYY-MM/)
  end
end
