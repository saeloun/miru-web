# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Approved payroll PTO", type: :request do
  include_context "approved mercury consultant payroll"
  around { |example| travel_to(Time.utc(2026, 12, 5, 12)) { example.run } }
  before { employment.update!(joined_at: Date.new(2020, 1, 1)) }

  let(:path) { "/api/v1/payroll_pto/#{employment.id}" }
  let(:configuration) do
    { effective_on: "2026-11-01", opening_on: "2026-11-01", opening_hours: "40", monthly_accrual_hours: "0",
      accrual_day: "1", leave_year_month: "4", leave_year_day: "1", carry_rule: "review", rate_basis: "origin_period_fee",
      advance_limit_hours: "80", exception_threshold_hours: "8", negative_threshold_hours: "8",
      evidence: "synthetic-approved-policy", reason: "Synthetic reconciled opening", idempotency_key: "synthetic-policy" }
  end

  it "requires an explicit workspace and owner policy, serves private facts without GET writes, and rejects forged quantities" do
    sign_in owner
    post "#{path}/policy", params: { company_id: company.id, pto_policy: configuration }
    expect(response).to have_http_status(201)
    expect do
      get path, params: { company_id: company.id, month: "2026-11" }
    end.not_to change(PayrollPtoEntry, :count)
    expect(response).to have_http_status(200)
    expect(response.headers["Cache-Control"]).to include("private", "no-store")
    facts = response.parsed_body.fetch("facts")
    post "#{path}/decisions", params: { company_id: company.id, pto_decision: {
      period: "2026-11-01", kind: "unpaid", reason: "Synthetic explicit unpaid", hours: "1",
      expected_digest: facts.fetch("digest"), idempotency_key: "forged-hours"
    } }
    expect(response).to have_http_status(422)
    expect(PayrollPtoEntry.where(kind: "unpaid")).to be_empty
    post "#{path}/decisions", params: { company_id: company.id, pto_decision: {
      period: "2026-11-01", kind: "defer", reason: "Synthetic explicit full-pay defer",
      expected_digest: facts.fetch("digest"), idempotency_key: "explicit-defer"
    } }
    expect(response).to have_http_status(201)
    post "#{path}/decisions", params: { pto_decision: { kind: "waive" } }
    expect(response).to have_http_status(409)
  end

  it "accepts one explicit exact remainder and rejects ambiguous or changed replay intent" do
    sign_in owner
    post "#{path}/policy", params: { company_id: company.id, pto_policy: configuration }
    expect(response).to have_http_status(201)
    expected = Payroll::PtoFacts.new(employment, month: run.period).call.fetch("expected_hours").to_d * 60
    work_entry.update!(duration: expected - 599, review_status: "approved")
    digest = Payroll::PtoFacts.new(employment, month: run.period).call.fetch("digest")
    command = { period: run.period.iso8601, kind: "allocation", reason: "Synthetic explicit API remainder",
      allocations: [{ kind: "paid", hours: "1" }, { kind: "unpaid", hours: "remaining" }],
      expected_digest: digest, idempotency_key: "api-remainder" }
    post "#{path}/decisions", params: { company_id: company.id, pto_decision: command }
    expect(response).to have_http_status(201)
    entry = PayrollPtoEntry.find(response.parsed_body.fetch("entry").fetch("id"))
    expect(entry.approved_allocations).to eq([{ "kind" => "paid", "minutes" => "60.0" }, { "kind" => "unpaid", "minutes" => "539.0" }])
    expect do
      post "#{path}/decisions", params: { company_id: company.id, pto_decision: command.merge(allocations: command[:allocations].reverse) }
      expect(response).to have_http_status(201)
      expect(response.parsed_body.fetch("entry").fetch("id")).to eq(entry.id)
    end.not_to change(PayrollPtoEntry, :count)
    post "#{path}/decisions", params: { company_id: company.id, pto_decision: command.merge(
      allocations: [{ kind: "paid", hours: "remaining" }, { kind: "unpaid", hours: "1" }]) }
    expect(response).to have_http_status(409)
    post "#{path}/decisions", params: { company_id: company.id, pto_decision: command.merge(idempotency_key: "stale-api-remainder") }
    expect(response).to have_http_status(409)
    current = Payroll::PtoFacts.new(employment, month: run.period).call.fetch("digest")
    [
      [{ kind: "paid", hours: "remaining" }, { kind: "unpaid", hours: "remaining" }],
      [{ kind: "paid", hours: "11" }, { kind: "unpaid", hours: "remaining" }]
    ].each do |allocations|
      post "#{path}/decisions", params: { company_id: company.id, pto_decision: command.merge(
        allocations:, expected_digest: current, idempotency_key: SecureRandom.uuid) }
      expect(response).to have_http_status(422)
    end
  end

  it "denies employees, cross-workspace records and accounts approval of a PTO treatment" do
    sign_in accounts
    allow(Payroll::PtoFacts).to receive(:new).and_call_original
    post "#{path}/policy", params: { company_id: company.id, pto_policy: configuration }
    expect(response).to have_http_status(403)
    get path, params: { company_id: company.id, month: "2026-11" }
    expect(response).to have_http_status(403)
    expect(Payroll::PtoFacts).not_to have_received(:new)
    run
    expect(run.current_revision).to be_nil
    get path, params: { company_id: company.id, month: "2026-11" }
    expect(response).to have_http_status(200)
    get "/api/v1/payroll_pto/report", params: { company_id: company.id, as_of: "2026-11-30" }
    expect(response).to have_http_status(403)
    sign_in worker
    worker.update!(current_workspace: company)
    worker.add_role(:employee, company)
    get path, params: { company_id: company.id, month: "2026-11" }
    expect(response).to have_http_status(403)
    sign_in owner
    foreign = create(:employment)
    get "/api/v1/payroll_pto/#{foreign.id}", params: { company_id: company.id, month: "2026-11" }
    expect(response).to have_http_status(404)
    expect(ConsultantPtoPolicy.count).to eq(0)
  end

  context "assigned-month subject scope" do
    before do
      run
      sign_in accounts
    end

    ["unconfigured", "joining after the month", "exited before the month"].each do |state|
      it "denies #{state} subjects before computing private PTO facts" do
        subject = if state == "unconfigured"
          create(:employment, company:, joined_at: "2020-01-01", resigned_at: nil)
        else
          employment.tap do |record|
            record.update!(state == "joining after the month" ? { joined_at: "2026-12-01" } : { resigned_at: "2026-10-31" })
          end
        end
        Payroll::PtoLedger.new(subject, actor: owner).configure!(**configuration)
        allow(Payroll::PtoFacts).to receive(:new).and_call_original

        get "/api/v1/payroll_pto/#{subject.id}", params: { company_id: company.id, month: "2026-11" }

        expect(response).to have_http_status(403)
        expect(Payroll::PtoFacts).not_to have_received(:new)
        expect(response.body).not_to include(configuration.fetch(:reason), configuration.fetch(:evidence))
      end
    end

    %w[owner admin].each do |role|
      it "preserves #{role} access to historical policies outside the preparation population" do
        manager = create(:user, current_workspace: company)
        create(:employment, company:, user: manager, joined_at: "2020-01-01", resigned_at: nil)
        manager.add_role(role, company)
        subject = create(:employment, company:, joined_at: "2020-01-01", resigned_at: "2026-10-31")
        Payroll::PtoLedger.new(subject, actor: owner).configure!(**configuration)
        sign_in manager

        get "/api/v1/payroll_pto/#{subject.id}", params: { company_id: company.id, month: "2026-11" }

        expect(response).to have_http_status(200)
        expect(response.parsed_body.dig("policy", "reason")).to eq(configuration.fetch(:reason))
      end
    end

    it "denies a foreign subject and a switched workspace before computing private facts" do
      foreign = create(:employment)
      allow(Payroll::PtoFacts).to receive(:new).and_call_original
      get "/api/v1/payroll_pto/#{foreign.id}", params: { company_id: company.id, month: "2026-11" }
      expect(response).to have_http_status(404)
      get path, params: { company_id: foreign.company_id, month: "2026-11" }
      expect(response).to have_http_status(409)
      expect(Payroll::PtoFacts).not_to have_received(:new)
    end
  end

  context "historical component selection" do
    let(:ledger) { Payroll::PtoLedger.new(employment, actor: owner) }
    let(:month) { Date.new(2026, 12, 1) }

    before do
      sign_in owner
      ledger.configure!(**configuration)
    end

    it "restores the exact available minutes when replacing a paid decision" do
      expected = Payroll::PtoFacts.new(employment, month: run.period).call.fetch("expected_hours").to_d * 60
      work_entry.update!(review_status: :approved, duration: expected - 2398)
      facts = Payroll::PtoFacts.new(employment, month: run.period).call
      first = ledger.decide!(period: run.period, kind: "paid", reason: "Synthetic absence leaving two minutes",
        expected_digest: facts.fetch("digest"), idempotency_key: "initial-paid-minutes")
      expect(Payroll::PtoFacts.new(employment, month: run.period).call.fetch("closing_minutes").to_d).to eq(2)

      work_entry.update!(duration: expected - 2400)
      facts = Payroll::PtoFacts.new(employment, month: run.period).call
      post "#{path}/decisions", params: { company_id: company.id, pto_decision: {
        period: run.period.iso8601, kind: "paid", reason: "Synthetic corrected forty-hour absence",
        expected_digest: facts.fetch("digest"), idempotency_key: "corrected-paid-minutes"
      } }
      expect(response).to have_http_status(201)
      expect(PayrollPtoEntry.where(employment:).count).to eq(2)
      expect(PayrollPtoEntry.last).to have_attributes(previous_entry_id: first.id, minutes: 2400, debt_minutes: 0,
        balance_delta_minutes: -2400, cash_amount_minor: 0)
      expect(Payroll::PtoFacts.new(employment, month: run.period).call.fetch("closing_minutes").to_d).to eq(0)
    end

    it "requires the original split component even after another component was consumed" do
      facts = Payroll::PtoFacts.new(employment, month: run.period).call
      half = (facts.fetch("gap_hours").to_d / 2).to_s("F")
      origin = ledger.allocate!(period: run.period, allocations: [{ kind: "defer", hours: half }, { kind: "correction", hours: half }],
        reason: "Synthetic split absence", expected_digest: facts.fetch("digest"), idempotency_key: "split-origin")
      consumed = historical_decision(origin, origin_component: "defer", idempotency_key: "consume-defer")
      post "#{path}/decisions", params: { company_id: company.id, pto_decision: consumed }
      expect(response).to have_http_status(201)
      expect(PayrollPtoEntry.last.origin_component).to eq("defer")

      omitted = historical_decision(origin, idempotency_key: "ambiguous-component")
      expect do
        post "#{path}/decisions", params: { company_id: company.id, pto_decision: omitted }
      end.not_to change(PayrollPtoEntry, :count)
      expect(response).to have_http_status(422)

      explicit = omitted.merge(origin_component: "correction", idempotency_key: "consume-correction")
      post "#{path}/decisions", params: { company_id: company.id, pto_decision: explicit }
      expect(response).to have_http_status(201)
      entry = PayrollPtoEntry.last
      expect(entry.origin_component).to eq("correction")
      expect do
        post "#{path}/decisions", params: { company_id: company.id, pto_decision: explicit }
      end.not_to change(PayrollPtoEntry, :count)
      expect(response).to have_http_status(201)
      expect(response.parsed_body.dig("entry", "id")).to eq(entry.id)
    end

    it "retains single-component legacy retries but requires a component after consumption" do
      facts = Payroll::PtoFacts.new(employment, month: run.period).call
      origin = ledger.decide!(period: run.period, kind: "defer", reason: "Synthetic single absence",
        expected_digest: facts.fetch("digest"), idempotency_key: "single-origin")
      command = historical_decision(origin, idempotency_key: "legacy-single")
      post "#{path}/decisions", params: { company_id: company.id, pto_decision: command }
      expect(response).to have_http_status(201)
      entry = PayrollPtoEntry.last
      expect(entry.origin_component).to eq("defer")
      expect do
        post "#{path}/decisions", params: { company_id: company.id, pto_decision: command }
      end.not_to change(PayrollPtoEntry, :count)
      expect(response).to have_http_status(201)
      expect(response.parsed_body.dig("entry", "id")).to eq(entry.id)

      expect do
        post "#{path}/decisions", params: { company_id: company.id,
          pto_decision: historical_decision(origin, idempotency_key: "resolved-without-component") }
      end.not_to change(PayrollPtoEntry, :count)
      expect(response).to have_http_status(422)
    end

    def historical_decision(origin, **options)
      { origin_entry_id: origin.id.to_s, period: month.iso8601, kind: "waive", reason: "Synthetic explicit historical review",
        expected_digest: Payroll::PtoFacts.new(employment, month:).call.fetch("digest") }.merge(options)
    end
  end
end
