# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Consultant payroll review", type: :request, issue: 2458 do
  let(:company) { create(:company, base_currency: "INR", timezone: "Asia/Kolkata") }
  let(:admin) { create(:user, current_workspace: company) }
  let(:consultant) { create(:user, current_workspace: company) }
  let!(:admin_membership) { create(:employment, company:, user: admin, resigned_at: nil) }
  let!(:employment) { create(:employment, company:, user: consultant, joined_at: "2026-01-01", resigned_at: nil) }

  before do
    travel_to Time.zone.local(2026, 10, 19, 12)
    enable_synthetic_payroll(company.id)
    admin.add_role(:admin, company)
    consultant.add_role(:employee, company)
    sign_in admin
    allow(CurrencyConversionService).to receive(:get_exchange_rate).and_return(BigDecimal("80"))
  end
  after { travel_back }

  def configure(**attributes)
    post "/api/v1/consultant_payroll/#{employment.id}/compensations", params: { consultant_compensation: {
      company_id: company.id, monthly_fee: "100000.00", effective_on: "2026-09-01", payment_source: "india",
      legal_entity_name: "Contracting entity", hours_per_day: "8.00", weekdays: %w[1 2 3 4 5],
      change_reason: "Agreed consultant terms"
    }.merge(attributes) }
  end

  def configured
    configure
    expect(response).to have_http_status(201)
    ConsultantCompensation.last
  end

  def preview(**attributes)
    post "/api/v1/consultant_payroll/#{employment.id}/preview", params: { payroll_preview: {
      company_id: company.id, month: "2026-09", cutoff: "2026-10-19"
    }.merge(attributes) }
  end

  def report
    response.parsed_body.fetch("review")
  end

  def expense(**attributes)
    create(:expense, company:, user: consultant, currency: "INR", amount: 5000, date: "2026-09-10", **attributes)
  end

  def holidays
    calendar = create(:holiday, company:, year: 2026, holiday_types: ["national", "optional"])
    create(:holiday_info, holiday: calendar, date: "2026-09-01")
    create(:holiday_info, holiday: calendar, date: "2026-09-02")
    calendar
  end

  it "preserves immutable fee history and separates contracting entity from the funding source" do
    original = configured
    configure(monthly_fee: "120000", payment_source: "mercury_us", change_reason: "Corrected effective terms")
    expect(response).to have_http_status(201)
    expect(original.reload.monthly_fee).to eq(BigDecimal("100000"))
    expect(ConsultantCompensation.count).to eq(2)
    preview
    expect(report).to include("monthly_fee" => "120000.0", "payment_source" => "mercury_us", "legal_entity_name" => "Contracting entity")
    get "/api/v1/consultant_payroll/#{employment.id}/compensations"
    expect(response.parsed_body.fetch("compensations").pluck("id")).to eq(ConsultantCompensation.order(id: :desc).pluck(:id))
    expect { original.update!(monthly_fee: "1") }.to raise_error(ActiveRecord::ReadonlyAttributeError)
    expect { employment.destroy! }.to change(ConsultantCompensation, :count).by(-2)
  end

  it "validates money, schedule, source, dates, reason and a stale workspace before creating terms" do
    [{ monthly_fee: "1.001" }, { monthly_fee: "100oops" }, { monthly_fee: "0" }, { weekdays: %w[1 1] },
      { weekdays: ["1bad"] }, { weekdays: [] }, { hours_per_day: "25" }, { hours_per_day: "NaN" },
      { effective_on: "invalid" }, { effective_on: "20260901" }, { effective_on: "0000-01-01" }, { effective_on: "2100-01-01" },
      { payment_source: "invented" }, { change_reason: "" }, { legal_entity_name: "" }].each do |attributes|
      configure(**attributes)
      expect(response).to have_http_status(422), attributes.to_s
    end
    configure(company_id: company.id + 1000)
    expect(response).to have_http_status(409)
    post "/api/v1/consultant_payroll/#{employment.id}/compensations", params: { consultant_compensation: "invalid" }
    expect(response).to have_http_status(400)
    expect(ConsultantCompensation.count).to eq(0)
  end

  it "calculates fractional working days and confirmed unpaid proration without prorating selected reimbursements" do
    configured
    holidays
    project = create(:project, client: create(:client, company:), billable: false)
    create(:timesheet_entry, project:, user: consultant, work_date: "2026-09-03", duration: 6000)
    claim = expense
    claim.approve!
    preview(confirmed_unpaid_hours: "60", unpaid_reason: "Explicit approved unpaid absence", expense_ids: [claim.id])
    expect(response).to have_http_status(200)
    expect(report).to include("expected_hours" => "160.0", "recorded_hours" => "100.0", "working_days" => "12.5",
      "fee_estimate" => "62500.0", "reimbursement_total" => "5000.0", "total_estimate" => "67500.0",
      "payment_ready" => false, "claims_reserved" => false)
    expect(claim.reload.status).to eq("approved")
    expect(request.filtered_parameters["payroll_preview"]).to eq("[FILTERED]")
    expect(response.headers["Cache-Control"]).to include("private", "no-store")
  end

  it "does not infer unpaid leave from missing work or treat unapproved time-off as paid PTO" do
    configured
    holidays
    project = create(:project, client: create(:client, company:))
    create(:timesheet_entry, project:, user: consultant, work_date: "2026-09-03", duration: 9000)
    leave = create(:leave, company:, year: 2026)
    create(:timeoff_entry, user: consultant, leave_type: create(:leave_type, leave:), duration: 600, leave_date: "2026-09-04")
    preview
    expect(report).to include("fee_estimate" => "100000.0", "recorded_timeoff_hours" => "10.0", "confirmed_unpaid_hours" => "0.0")
    expect(report.fetch("warnings")).to include("unexplained_hours", "timeoff_requires_review")
  end

  it "deduplicates holiday dates and does not turn historical leave into current salary deductions" do
    configured
    calendar = holidays
    duplicate = create(:holiday_info, holiday: calendar, date: "2026-09-01")
    create(:timeoff_entry, user: consultant, leave_type: nil, holiday_info: duplicate, leave_date: duplicate.date, duration: 480)
    leave = create(:leave, company:, year: 2026)
    create(:timeoff_entry, user: consultant, leave_type: create(:leave_type, leave:), duration: 10000, leave_date: "2026-07-01")
    preview
    expect(report).to include("expected_hours" => "160.0", "fee_estimate" => "100000.0", "recorded_timeoff_hours" => "0.0")
  end

  it "isolates company work and excludes pending, rejected and discarded work from accepted hours" do
    configured
    own_project = create(:project, client: create(:client, company:))
    create(:timesheet_entry, project: own_project, user: consultant, work_date: "2026-09-03", duration: 60)
    create(:timesheet_entry, project: own_project, user: consultant, work_date: "2026-09-04", duration: 120, review_status: :pending_review)
    create(:timesheet_entry, project: own_project, user: consultant, work_date: "2026-09-05", duration: 180, review_status: :rejected)
    create(:timesheet_entry, project: own_project, user: consultant, work_date: "2026-09-06", duration: 480, discarded_at: Time.current)
    create(:timesheet_entry, user: consultant, work_date: "2026-09-03", duration: 480)
    preview
    expect(report).to include("recorded_hours" => "6.0", "unresolved_work_hours" => "5.0", "approved_work_hours" => "0.0",
      "not_required_work_hours" => "1.0", "fee_estimate" => "100000.0")
    expect(report).to include("pending_work_hours" => "2.0", "rejected_work_hours" => "3.0")
    expect(report.fetch("warnings")).to include("work_requires_review")
  end

  it "requires explicit, cutoff-valid INR claim selection and refuses stale or foreign claim IDs" do
    configured
    valid = expense
    valid.approve!
    paid = expense
    paid.approve!
    paid.mark_paid!
    unknown = expense(status: :approved)
    unknown.update_column(:approved_at, nil)
    late = expense
    late.approve!
    late.update_column(:approved_at, Time.zone.local(2026, 10, 20))
    foreign = expense(currency: "USD")
    foreign.approve!
    other = create(:expense, company:, user: admin, currency: "INR", status: :approved)
    preview
    expect(report.fetch("reimbursement_total")).to eq("0.0")
    expect(report.fetch("eligible_expenses").pluck("id")).to eq([valid.id])
    [paid, unknown, late, foreign, other].each do |invalid|
      preview(expense_ids: [invalid.id])
      expect(response).to have_http_status(422), invalid.id.to_s
    end
    preview(expense_ids: [valid.id, valid.id])
    expect(response).to have_http_status(422)
    preview(expense_ids: [valid.id])
    expect(report.fetch("reimbursement_total")).to eq("5000.0")
  end

  it "does not estimate fee for partial service, midmonth terms, unknown service dates or zero scheduled hours" do
    configured
    configure(effective_on: "2026-09-15", monthly_fee: "120000")
    preview
    expect(report.fetch("fee_estimate")).to be_nil
    expect(report.fetch("warnings")).to include("terms_changed_during_month")
    employment.update!(joined_at: "2026-10-15")
    preview(month: "2026-10")
    expect(report.fetch("fee_estimate")).to be_nil
    expect(report.fetch("warnings")).to include("partial_service")
    employment.update_column(:joined_at, nil)
    preview(month: "2026-10")
    expect(report.fetch("warnings")).to include("missing_service_dates")
  end

  it "rejects invalid preview inputs and unpaid hours without a reason or beyond expected hours" do
    configured
    [{ month: "2026-99" }, { cutoff: "2026-10-99" }, { cutoff: "20261019" }, { month: "2027-01" }, { cutoff: "2026-08-01" },
      { confirmed_unpaid_hours: "1.001" }, { confirmed_unpaid_hours: ["60"] }, { expense_ids: "1" },
      { confirmed_unpaid_hours: "1e2" }, { confirmed_unpaid_hours: "1" },
      { confirmed_unpaid_hours: "99999", unpaid_reason: "Too many" }, { expense_ids: ["1bad"] }].each do |attributes|
      preview(**attributes)
      expect(response).to have_http_status(422), attributes.to_s
    end
    post "/api/v1/consultant_payroll/#{employment.id}/preview", params: { payroll_preview: "invalid" }
    expect(response).to have_http_status(422)
  end

  it "uses the company timezone for the approval cutoff and requires reapproval after claim changes" do
    configured
    claim = expense
    claim.approve!
    expect(claim.approved_at).to eq(Time.current)
    claim.update!(amount: 6000)
    expect(claim.approved_at).to be_nil
    preview(expense_ids: [claim.id])
    expect(response).to have_http_status(422)
    claim.approve!
    cutoff = ActiveSupport::TimeZone[company.timezone].local(2026, 10, 18).end_of_day.change(usec: 999999)
    claim.update_column(:approved_at, cutoff)
    claim.approve!
    expect(claim.approved_at).to eq(cutoff)
    preview(cutoff: "2026-10-18", expense_ids: [claim.id])
    expect(report.fetch("reimbursement_total")).to eq("6000.0")
    claim.update_column(:approved_at, cutoff + 1.second)
    preview(cutoff: "2026-10-18", expense_ids: [claim.id])
    expect(response).to have_http_status(422)
  end

  it "requires manual resolution when every scheduled day is a holiday" do
    configured
    configure(weekdays: [7])
    calendar = create(:holiday, company:, year: 2026)
    [6, 13, 20, 27].each { |day| create(:holiday_info, holiday: calendar, date: Date.new(2026, 9, day)) }
    preview
    expect(report).to include("expected_hours" => "0.0", "fee_estimate" => nil, "total_estimate" => nil)
    expect(report.fetch("warnings")).to include("zero_expected_hours")
    preview(confirmed_unpaid_hours: "1", unpaid_reason: "Invalid for zero scheduled hours")
    expect(response).to have_http_status(422)
  end

  it "denies generic bookkeepers, employees and cross-company configuration or salary access" do
    configured
    sign_in consultant
    get "/api/v1/consultant_payroll", params: { month: "2026-09", cutoff: "2026-10-19" }
    expect(response).to have_http_status(403)
    consultant.add_role(:book_keeper, company)
    preview
    expect(response).to have_http_status(403)
    configure
    expect(response).to have_http_status(403)
    other = create(:company)
    admin.update!(current_workspace: other)
    create(:employment, company: other, user: admin, resigned_at: nil)
    admin.add_role(:admin, other)
    enable_synthetic_payroll(other.id)
    sign_in User.find(admin.id)
    get "/api/v1/consultant_payroll/#{employment.id}/compensations"
    expect(response).to have_http_status(404)
  end

  it "paginates configured consultants, excludes other workspaces and leaves incomplete people individually flagged" do
    configured
    another = create(:user, current_workspace: company)
    another.add_role(:employee, company)
    membership = create(:employment, company:, user: another, joined_at: "2026-01-01", resigned_at: nil)
    ConsultantCompensation.create!(employment: membership, created_by: admin, monthly_fee: "1", effective_on: "2026-11-01",
      payment_source: "india", legal_entity_name: "Contracting entity", change_reason: "Future terms", hours_per_day: "8", weekdays: [1, 2, 3, 4, 5])
    get "/api/v1/consultant_payroll", params: { month: "2026-09", cutoff: "2026-10-19", page: "1" }
    expect(response).to have_http_status(200)
    rows = response.parsed_body.fetch("reviews")
    expect(rows.size).to eq(2)
    expect(rows.find { |row| row["employment_id"] == membership.id }.fetch("warnings")).to include("missing_terms")
    expect(rows.find { |row| row["employment_id"] == employment.id }.fetch("monthly_fee")).to eq("100000.0")
    get "/api/v1/consultant_payroll", params: { month: "2026-09", cutoff: "2026-10-19", page: { bad: "1" } }
    expect(response).to have_http_status(422)
  end

  it "protects cookie-authenticated configuration writes with CSRF" do
    controller = Api::V1::ConsultantPayrollController
    original = controller.allow_forgery_protection
    controller.allow_forgery_protection = true
    configure
    expect(response).to have_http_status(422)
    expect(ConsultantCompensation.count).to eq(0)
  ensure
    controller.allow_forgery_protection = original
  end

  it "keeps every preview endpoint and direct calculation or term creation disabled outside the enabled company" do
    terms = configured
    allow(ENV).to receive(:[]).with("MIRU_PAYROLL_ENABLED").and_return("false")
    get "/api/v1/consultant_payroll", params: { month: "2026-09", cutoff: "2026-10-19" }
    expect(response).to have_http_status(403)
    get "/api/v1/consultant_payroll/#{employment.id}/compensations"
    expect(response).to have_http_status(403)
    configure
    expect(response).to have_http_status(403)
    preview
    expect(response).to have_http_status(403)
    expect do
      terms.dup.save!
    end.to raise_error(Payroll::Entitlement::NotEnabled)
    expect do
      Payroll::ConsultantReview.new(employment:, month: Date.new(2026, 9, 1), cutoff: Date.new(2026, 10, 19)).process
    end.to raise_error(Payroll::Entitlement::NotEnabled)
  end

  it "rounds fractional unpaid proration once and preserves a zero-fee month's selected reimbursement" do
    configured
    holidays
    configure(monthly_fee: "100000.01")
    preview(confirmed_unpaid_hours: "59.99", unpaid_reason: "Reviewed fractional unpaid time")
    expect(report.fetch("fee_estimate")).to eq("62506.26")
    claim = expense
    claim.approve!
    preview(confirmed_unpaid_hours: "160", unpaid_reason: "Reviewed full unpaid month", expense_ids: [claim.id])
    expect(report).to include("fee_estimate" => "0.0", "reimbursement_total" => "5000.0", "total_estimate" => "5000.0")
  end

  it "uses configured daily hours for expected hours while keeping recorded days at hours divided by eight" do
    configured
    holidays
    configure(hours_per_day: "4")
    project = create(:project, client: create(:client, company:))
    create(:timesheet_entry, project:, user: consultant, work_date: "2026-09-03", duration: 240, review_status: :approved)
    preview(confirmed_unpaid_hours: "76", unpaid_reason: "Reviewed unpaid hours on a four-hour schedule")
    expect(report).to include("expected_hours" => "80.0", "recorded_hours" => "4.0", "working_days" => "0.5", "fee_estimate" => "5000.0")
  end

  it "counts selected optional holidays without treating unselected optional dates as holidays" do
    configured
    calendar = holidays
    selected = create(:holiday_info, holiday: calendar, category: :optional, date: "2026-09-03")
    create(:holiday_info, holiday: calendar, category: :optional, date: "2026-09-04")
    create(:timeoff_entry, user: consultant, leave_type: nil, holiday_info: selected, leave_date: selected.date, duration: 480)
    preview
    expect(report.fetch("expected_hours")).to eq("152.0")
    expect(report.fetch("recorded_timeoff_hours")).to eq("0.0")
  end

  it "restricts source work to active service dates and blocks an invented exit-month fee" do
    configured
    employment.update!(resigned_at: "2026-09-15")
    project = create(:project, client: create(:client, company:))
    create(:timesheet_entry, project:, user: consultant, work_date: "2026-09-15", duration: 240)
    create(:timesheet_entry, project:, user: consultant, work_date: "2026-09-16", duration: 480)
    preview
    expect(report).to include("recorded_hours" => "4.0", "fee_estimate" => nil, "total_estimate" => nil)
    expect(report.fetch("warnings")).to include("partial_service")
  end

  it "rechecks live admin access after a cached role or employment is revoked" do
    configured
    admin.has_cached_role?(:admin, company)
    admin.remove_role(:admin, company)
    get "/api/v1/consultant_payroll", params: { month: "2026-09", cutoff: "2026-10-19" }
    expect(response).to have_http_status(403)
    admin.add_role(:admin, company)
    admin_membership.discard!
    preview
    expect(response).to have_http_status(401)
    expect(ConsultantPayrollPolicy.new(admin, :consultant_payroll).index?).to be(false)
  end

  it "never reserves or settles selected claims even when the same preview is submitted repeatedly" do
    configured
    claim = expense
    claim.approve!
    original = claim.reload.attributes
    2.times do
      preview(expense_ids: [claim.id])
      expect(report).to include("reimbursement_total" => "5000.0", "claims_reserved" => false, "payment_ready" => false)
    end
    expect(claim.reload.attributes).to eq(original)
    claim.mark_paid!
    preview(expense_ids: [claim.id])
    expect(response).to have_http_status(422)
  end

  it "requires effective terms before an unpaid scenario without affecting a valid period" do
    configured
    configure(effective_on: "2026-08-01")
    preview(month: "2026-07")
    expect(report).to include("monthly_fee" => nil, "fee_estimate" => nil)
    expect(report.fetch("warnings")).to include("missing_terms")
    preview(month: "2026-07", confirmed_unpaid_hours: "1", unpaid_reason: "Cannot apply without agreed terms")
    expect(response).to have_http_status(422)
    preview
    expect(report.fetch("fee_estimate")).to eq("100000.0")
  end

  it "validates cutoff and month in the company timezone across the application UTC date boundary" do
    configured
    Time.use_zone("UTC") do
      travel_to Time.utc(2026, 10, 19, 20)
      preview(cutoff: "2026-10-20")
      expect(response).to have_http_status(200)
      preview(cutoff: "2026-10-21")
      expect(response).to have_http_status(422)
      travel_to Time.utc(2026, 10, 31, 20)
      get "/api/v1/consultant_payroll", params: { month: "2026-11", cutoff: "2026-11-01" }
      expect(response).to have_http_status(200)
      get "/api/v1/consultant_payroll"
      expect(response.parsed_body.fetch("period")).to eq("month" => "2026-10", "cutoff" => "2026-11-01", "today" => "2026-11-01")
    end
  end
end
