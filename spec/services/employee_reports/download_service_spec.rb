# frozen_string_literal: true

require "rails_helper"
require "csv"

RSpec.describe EmployeeReports::DownloadService do
  let(:company) { create(:company, timezone: "Pacific Time (US & Canada)") }
  let(:user) { create(:user, current_workspace: company) }
  let(:employment) { create(:employment, company:, user:, resigned_at: nil, joined_at: Date.new(2020, 1, 1)) }
  let(:report) { EmployeeReport.create!(company:, name: "Sources", columns: EmployeeReports::Columns::DEFINITIONS.keys) }

  around { |example| travel_to(Time.utc(2026, 10, 15)) { example.run } }

  def row
    csv = described_class.new(report:, month: "2026-10", employments: Employment.where(id: employment.id)).process
    CSV.parse(csv, headers: true).first
  end

  it "leaves joining date and calendar weekdays blank for an incomplete active profile" do
    employment.update_column(:joined_at, nil)
    expect(row.to_h).to include("Joining date" => "", "Month calendar weekdays (Mon–Fri)" => "")
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
    create(:expense, company:, user:, amount: 60, currency: "USD", expense_type: :personal, status: :paid,
      approved_at: Time.utc(2026, 10, 2), paid_at: Time.utc(2026, 11, 1, 7))
    prior_approval = create(:expense, company:, user:, amount: 70, currency: "USD", expense_type: :personal, status: :approved)
    prior_approval.update_column(:approved_at, Time.utc(2026, 10, 1, 6, 59))
    create(:expense, company:, user:, amount: 80, currency: "USD", expense_type: :personal, status: :paid,
      approved_at: Time.utc(2026, 10, 2), paid_at: Time.utc(2026, 10, 3), discarded_at: Time.current)
    create(:expense, user:, amount: 90, currency: "USD", expense_type: :personal, status: :paid,
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

  it "preserves large decimal reimbursement amounts exactly for both statuses" do
    [:paid, :approved].each do |status|
      create(:expense, company:, user:, amount: "900719925474099.99", currency: "INR",
        expense_type: :personal, status:, approved_at: Time.utc(2026, 10, 2), paid_at: Time.utc(2026, 10, 3))
    end
    result = row
    expect(result["Month recorded paid reimbursements by currency (JSON)"]).to eq('{"INR":"900719925474099.99"}')
    expect(result["Month approved unpaid reimbursements by currency (JSON)"]).to eq('{"INR":"900719925474099.99"}')
  end

  it "preserves empty monthly values and only loads selected source columns" do
    expect(row.to_h).to include("Month recorded work (minutes)" => "0.0", "Month recorded time off (minutes)" => "0",
      "Month recorded working days" => "0", "Month recorded paid reimbursements by currency (JSON)" => "{}",
      "Month approved unpaid reimbursements by currency (JSON)" => "{}", "Month configured national holiday dates (JSON)" => "[]")
    report.update!(columns: ["name"])
    expect(TimeoffEntry).not_to receive(:from_workspace)
    expect(TimesheetEntry).not_to receive(:kept)
    expect(Expense).not_to receive(:kept)
    expect(company).not_to receive(:holiday_infos)
    expect(row.headers).to eq(["Employee name"])
  end

  it "keeps uncached export queries constant as staff grows while returning every employee's totals" do
    project = create(:project, company:)
    leave_type = create(:leave_type, leave: create(:leave, company:, year: 2026))
    staff = [employment] + 7.times.map { create(:employment, company:, resigned_at: nil, joined_at: Date.new(2020, 1, 1)) }
    staff.each do |member|
      create(:timesheet_entry, project:, user: member.user, work_date: "2026-10-01", duration: 60)
      create(:timeoff_entry, user: member.user, leave_type:, leave_date: "2026-10-02", duration: 120)
      create(:expense, company:, user: member.user, amount: "12.34", currency: "USD", expense_type: :personal,
        status: :paid, approved_at: Time.utc(2026, 10, 2), paid_at: Time.utc(2026, 10, 3))
      create(:expense, company:, user: member.user, amount: "5.67", currency: "INR", expense_type: :personal,
        status: :approved, approved_at: Time.utc(2026, 10, 2))
    end
    holiday = create(:holiday, company:, year: 2026)
    create(:holiday_info, holiday:, date: "2026-10-02", category: :national)
    export = ->(members) { described_class.new(report:, month: "2026-10", employments: Employment.where(id: members.map(&:id))).process }
    export.call(staff)
    counts = [staff.first(1), staff].map do |members|
      queries = []
      subscriber = ->(*args) do
        payload = args.last
        queries << payload[:sql] if payload[:sql].lstrip.start_with?("SELECT") && payload[:name] != "SCHEMA"
      end
      ActiveRecord::Base.uncached do
        ActiveSupport::Notifications.subscribed(subscriber, "sql.active_record") do
          rows = CSV.parse(export.call(members), headers: true)
          expect(rows.size).to eq(members.size)
          rows.each do |result|
            expect(result.to_h).to include("Month recorded work (minutes)" => "60.0",
              "Month recorded time off (minutes)" => "120", "Month recorded working days" => "1",
              "Month recorded paid reimbursements by currency (JSON)" => '{"USD":"12.34"}',
              "Month approved unpaid reimbursements by currency (JSON)" => '{"INR":"5.67"}',
              "Month configured national holiday dates (JSON)" => '["2026-10-02"]')
          end
        end
      end
      queries.size
    end
    expect(counts.last).to eq(counts.first)
  end
end
