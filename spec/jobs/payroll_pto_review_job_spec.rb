# frozen_string_literal: true

require "rails_helper"

RSpec.describe PayrollPtoReviewJob, type: :job do
  include_context "approved mercury consultant payroll"
  around { |example| travel_to(Time.utc(2026, 12, 5, 12)) { example.run } }

  def configure(opening: "-40")
    employment.update!(joined_at: Date.new(2020, 1, 1))
    Payroll::PtoLedger.new(employment, actor: owner).configure!(effective_on: "2026-11-01", opening_on: "2026-11-01",
      opening_hours: opening, monthly_accrual_hours: "0", accrual_day: "1", leave_year_month: "4", leave_year_day: "1",
      carry_rule: "review", rate_basis: "origin_period_fee", advance_limit_hours: "80", exception_threshold_hours: "8",
      negative_threshold_hours: "8", reason: "Synthetic private reconciliation reason", evidence: "Synthetic opening evidence", idempotency_key: "policy")
  end

  it "journals private review notices once per case version and recipient without sending pay details" do
    configure
    2.times { described_class.perform_now }
    notices = PayrollPtoNotification.where(company:, employment:)
    expect(notices.where(kind: "threshold").count).to eq(1)
    notice = notices.find_by!(kind: "threshold")
    email = PayrollPtoMailer.review(notice.id)
    expect(email.to).to eq([owner.email])
    expect(email.body.encoded).to include("payroll")
    expect(email.body.encoded).not_to include("Synthetic private reconciliation reason", "100000", bank_details["bank_account_number"])
    expect do
      2.times { PayrollPtoNoticeJob.perform_now(notice.id) }
    end.to change { ActionMailer::Base.deliveries.size }.by(1)
    expect(notice.reload.state).to eq("sent")
    travel_to(Time.utc(2027, 4, 1, 12))
    2.times { described_class.perform_now }
    expect(PayrollPtoNotification.where(company:, employment:, recipient: owner, kind: "year_end").count).to eq(1)
    expect(Payroll::PtoReport.new(company, as_of: Date.current).call.fetch(:cases).first.fetch(:year_end_review)).to be(true)
  end

  it "notifies an active owner even when another workspace is currently selected" do
    configure
    owner.update!(current_workspace: create(:company))
    2.times { described_class.perform_now }
    notice = PayrollPtoNotification.find_by!(company:, employment:, recipient: owner, kind: "threshold")
    expect { PayrollPtoNoticeJob.perform_now(notice.id) }.to change { ActionMailer::Base.deliveries.size }.by(1)
  end

  it "requires review exactly when an explicitly approved fractional advance reaches the negative threshold" do
    configure(opening: "-7.99")
    record_synthetic_pto_treatment
    as_of = Date.new(2026, 11, 30)
    report = Payroll::PtoReport.new(company, as_of:).call.fetch(:cases).sole
    expect(report.fetch(:facts)).to include("closing_minutes" => "-479.4", "unresolved_minutes" => "0.0")
    expect(report.fetch(:threshold_review)).to be(false)

    facts = Payroll::PtoFacts.new(employment, month: as_of).call
    Payroll::PtoLedger.new(employment, actor: owner).allocate!(period: as_of.beginning_of_month,
      allocations: [{ kind: "advance", hours: "0.01" }, { kind: "defer", hours: (facts.fetch("gap_hours").to_d - "0.01".to_d).to_s("F") }],
      reason: "Synthetic explicitly reviewed threshold advance", expected_digest: facts.fetch("digest"), idempotency_key: "threshold-advance")
    report = Payroll::PtoReport.new(company, as_of:).call.fetch(:cases).sole
    expect(report.fetch(:facts)).to include("closing_minutes" => "-480.0", "unresolved_minutes" => "0.0")
    expect(report.fetch(:threshold_review)).to be(true)
  end

  it "keeps exit review with active administrators and does not send correction mail to a departed payee" do
    configure(opening: "0")
    facts = Payroll::PtoFacts.new(employment, month: Date.new(2026, 11, 1)).call
    Payroll::PtoLedger.new(employment, actor: owner).decide!(period: Date.new(2026, 11, 1), kind: "correction",
      reason: "Synthetic requested correction", expected_digest: facts.fetch("digest"), idempotency_key: "correction")
    employment.update!(resigned_at: Date.new(2026, 11, 30))
    described_class.perform_now
    expect(PayrollPtoNotification.where(company:, employment:, recipient: worker, kind: "correction")).to be_empty
    expect(PayrollPtoNotification.where(company:, employment:, recipient: owner, kind: "exit").count).to eq(1)
  end
end
