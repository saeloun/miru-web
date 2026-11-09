# frozen_string_literal: true

require "rails_helper"
require "timeout"

RSpec.describe "Reviewed consultant service-period fee" do
  before do |example|
    if example.metadata[:fee_concurrency]
      DatabaseCleaner.clean
      DatabaseCleaner.strategy = :deletion
      DatabaseCleaner.start
    end
  end
  include_context "approved mercury consultant payroll"

  around { |example| travel_to(Time.utc(2026, 12, 5, 12)) { example.run } }
  let(:service) { Payroll::ServiceFeeReview.new(employment, actor: owner) }

  def save_fee(amount: "50000.00", **attributes)
    summary = service.summary(period: "2026-11")
    service.record!(period: "2026-11", amount:, reason: "Agreed service-period fee", expected_digest: summary[:digest],
      expected_review_id: summary.dig(:current_review, :id).to_s, idempotency_key: SecureRandom.uuid, **attributes)
  end

  it "stores an explicit joining-period fee before PTO and derives its actual scheduled minutes" do
    employment.update!(joined_at: "2026-11-16")
    summary = save_fee
    expect(summary[:current_review]).to include(amount: "50000.0", current: true)
    expect(summary[:context]).to include("service_from" => "2026-11-16", "service_to" => "2026-11-30", "scheduled_minutes" => "5280.0")
    review = Payroll::ConsultantReview.new(employment:, month: run.period, cutoff: Date.current).process(include_pto: false)
    expect(review).to include(expected_hours: "88.0", monthly_fee: "62500.0", period_base_fee: "50000.0", fee_estimate: "50000.0")
  end

  it "supports an exit period without inventing a calendar-day proration" do
    employment.update!(joined_at: "2020-01-01", resigned_at: "2026-11-13")
    save_fee(amount: "40000.00")
    review = Payroll::ConsultantReview.new(employment:, month: run.period, cutoff: Date.current).process(include_pto: false)
    expect(review).to include(expected_hours: "80.0", fee_estimate: "40000.0")
  end

  it "uses each date's actual schedule and an explicit fee across a midmonth change" do
    employment.update!(joined_at: "2020-01-01")
    ConsultantCompensation.create!(employment:, created_by: owner, effective_on: "2026-11-16", monthly_fee: "100000",
      hours_per_day: 4, weekdays: [1, 2, 3, 4, 5], payment_source: "mercury_us", legal_entity_name: legal_name, change_reason: "New schedule")
    save_fee(amount: "72000.00")
    review = Payroll::ConsultantReview.new(employment:, month: run.period, cutoff: Date.current,
      inputs: { confirmed_unpaid_hours: "8", unpaid_reason: "Approved absence" }).process(include_pto: false)
    expect(review).to include(expected_hours: "124.0", monthly_fee: "62500.0", period_base_fee: "72000.0", fee_estimate: "67354.84")
  end

  it "applies the reviewed basis to PTO and both approvals, invalidating a changed amount without rewriting its origin" do
    employment.update!(joined_at: "2020-01-01", resigned_at: "2026-11-13")
    saved = save_fee
    configure_synthetic_pto_policy
    record_synthetic_pto_treatment(unpaid_hours: "8")
    review = Payroll::ConsultantReview.new(employment:, month: run.period, cutoff: Date.current).process
    expect(review).to include(monthly_fee: "62500.0", period_base_fee: "50000.0", fee_estimate: "45000.0")
    origin = PayrollPtoEntry.heads.find_by!(employment:, case_key: "month:2026-11-01")
    expect(origin.rate_basis).to include("origin_amount" => "50000.0", "origin_hours" => "80.0")
    expect(origin.rate_basis.dig("service_fee_review", "id")).to eq(saved.dig(:current_review, :id))
    revision = Payroll::ConsultantRevision.new(run, actor: accounts).create!(consultants: [{ employment_id: employment.id, acknowledged: true }],
      cutoff: Date.current.iso8601, expected_digest: nil, idempotency_key: "reviewed-period")
    expect(revision.payroll_payload.dig("lines", 0, "amounts", "base_minor")).to eq(4_500_000)
    expect(revision.approval_issues).to eq([])
    workflow.approve!(actor: accounts, stage: "accounts", expected_digest: revision.digest)
    workflow.approve!(actor: owner, stage: "final", expected_digest: revision.digest)
    expect(workflow.status).to eq("approved")
    save_fee(amount: "60000")
    expect(Payroll::PtoFacts.new(employment, month: run.period).call["blockers"]).to include("pto_decision_source_changed")
    expect(workflow.status).not_to eq("approved")
    expect(origin.reload.rate_basis.fetch("origin_amount")).to eq("50000.0")
    record_synthetic_pto_treatment(unpaid_hours: "8")
    replacement = Payroll::ConsultantRevision.new(run, actor: accounts).create!(consultants: [{ employment_id: employment.id, acknowledged: true }],
      cutoff: Date.current.iso8601, expected_digest: revision.digest, idempotency_key: "reapproved-period")
    expect(replacement.payroll_payload.dig("lines", 0, "amounts", "base_minor")).to eq(5_400_000)
    workflow.approve!(actor: accounts, stage: "accounts", expected_digest: replacement.digest)
    workflow.approve!(actor: owner, stage: "final", expected_digest: replacement.digest)
    expect(workflow.status).to eq("approved")
  end

  it "returns the original command result on replay after replacement without promoting it" do
    employment.update!(joined_at: "2026-11-16")
    input = { period: "2026-11", amount: "50000", reason: "First agreed fee", expected_digest: service.summary(period: "2026-11")[:digest],
      expected_review_id: "", idempotency_key: "same-command" }
    first = service.record!(**input)
    replacement = save_fee(amount: "60000")
    replay = service.record!(**input)
    expect(replay.dig(:recorded_review, :id)).to eq(first.dig(:recorded_review, :id))
    expect(replay.dig(:recorded_review, :current)).to be(false)
    expect(replay.dig(:current_review, :id)).to eq(replacement.dig(:current_review, :id))
    expect(ConsultantServiceFeeReview.count).to eq(2)
    expect { service.record!(**input.merge(amount: "51000")) }.to raise_error(Payroll::Workflow::Conflict)
  end

  it "rejects stale context and predecessors, invalid money, missing terms and mixed routing" do
    employment.update!(joined_at: "2026-11-16")
    initial = service.summary(period: "2026-11")
    save_fee
    expect do
      service.record!(period: "2026-11", amount: "1", reason: "New", expected_digest: initial[:digest], expected_review_id: "", idempotency_key: "stale")
    end.to raise_error(Payroll::Workflow::Conflict)
    %w[0 -1 NaN Infinity 1.001 1e2].each do |amount|
      expect { save_fee(amount:) }.to raise_error(Payroll::ConsultantReview::InvalidInput)
    end
    ConsultantCompensation.create!(employment:, created_by: owner, effective_on: "2026-11-20", monthly_fee: "100000",
      hours_per_day: 8, weekdays: [1, 2, 3, 4, 5], payment_source: "india", legal_entity_name: legal_name, change_reason: "Different source")
    expect(service.summary(period: "2026-11")[:blockers]).to include("service_routing_changed")
    expect { save_fee }.to raise_error(Payroll::Workflow::Conflict)
    employment.update!(joined_at: "2026-10-15")
    expect(service.summary(period: "2026-10")[:blockers]).to include("service_terms_missing")
  end

  it "authorizes before reading and permits only specifically assigned active accounts" do
    employment.update!(joined_at: "2020-01-01")
    stranger = create(:user, current_workspace: company)
    create(:employment, company:, user: stranger, joined_at: "2020-01-01", resigned_at: nil)
    stranger.add_role(:book_keeper, company)
    expect { Payroll::ServiceFeeReview.new(employment, actor: stranger).summary(period: "2026-11") }.to raise_error(Payroll::Workflow::NotAuthorized)
    run
    expect(Payroll::ServiceFeeReview.new(employment, actor: accounts).summary(period: "2026-11")).to include(period: "2026-11")
    owner.update!(current_workspace: create(:company))
    expect { service.summary(period: "2026-11") }.to raise_error(Payroll::Workflow::NotAuthorized)
  end

  it "protects adopted rows from raw SQL update, delete and cross-tenant insertion" do
    employment.update!(joined_at: "2026-11-16")
    save_fee
    row = ConsultantServiceFeeReview.sole
    connection = ActiveRecord::Base.connection
    ["UPDATE consultant_service_fee_reviews SET amount_minor=1 WHERE id=#{row.id}", "DELETE FROM consultant_service_fee_reviews WHERE id=#{row.id}"].each do |sql|
      expect do
        connection.transaction(requires_new: true) { connection.execute(sql) }
      end.to raise_error(ActiveRecord::StatementInvalid, /immutable/)
    end
    other = create(:company)
    attributes = row.attributes.except("id").merge("company_id" => other.id, "idempotency_key" => "foreign", "previous_review_id" => row.id)
    expect do
      connection.transaction(requires_new: true) { ConsultantServiceFeeReview.insert_all!([attributes]) }
    end.to raise_error(ActiveRecord::StatementInvalid)
    expect(row.reload.amount_minor).to eq(5_000_000)
  end

  it "keeps India report labels distinct and locks the basis after its approved handoff" do
    employment.update!(joined_at: "2020-01-01", resigned_at: "2026-11-13")
    ConsultantCompensation.create!(employment:, created_by: owner, effective_on: "2026-11-01", monthly_fee: "100000",
      hours_per_day: 8, weekdays: [1, 2, 3, 4, 5], payment_source: "india", legal_entity_name: legal_name, change_reason: "India funding")
    save_fee
    configure_synthetic_pto_policy
    record_synthetic_pto_treatment(unpaid_hours: "8")
    revision = Payroll::ConsultantRevision.new(run, actor: accounts).create!(consultants: [{ employment_id: employment.id, acknowledged: true }],
      cutoff: Date.current.iso8601, expected_digest: nil, idempotency_key: "india-period")
    workflow.approve!(actor: accounts, stage: "accounts", expected_digest: revision.digest)
    workflow.approve!(actor: owner, stage: "final", expected_digest: revision.digest)
    preview = Payroll::IndiaHandoff.new(run).preview(employment_id: employment.id)
    expect(preview[:blockers]).to eq([])
    expect(preview[:report]).to include("monthly_fee" => "100000.0", "period_base_fee" => "50000.0", "entitlement_minor" => 4_500_000)
    handoff = Payroll::IndiaHandoff.new(run).create!(actor: owner, employment_id: employment.id, expected_digest: revision.digest,
      accounts_email: "accounts@example.test", bank_confirmed: true, expected_bank_digest: preview[:report]["bank_digest"])
    expect { save_fee(amount: "60000") }.to raise_error(Payroll::Workflow::Conflict, /Bank activity/)
    original = ConsultantServiceFeeReview.sole
    values = original.attributes.except("id").merge("previous_review_id" => original.id, "idempotency_key" => "raw-protected")
    expect do
      ActiveRecord::Base.connection.transaction(requires_new: true) { ConsultantServiceFeeReview.insert_all!([values]) }
    end.to raise_error(ActiveRecord::StatementInvalid, /protected bank activity/)
    expect(handoff.reload.entitlement_minor).to eq(4_500_000)
  end

  it "refuses to replace a fee basis once earned accrual has consumed its PTO origin" do
    employment.update!(joined_at: "2026-11-16")
    work_entry.update!(work_date: "2026-11-16")
    save_fee
    ledger = Payroll::PtoLedger.new(employment, actor: owner)
    ledger.configure!(effective_on: "2026-11-01", opening_on: "2026-11-01", opening_hours: "0", monthly_accrual_hours: "16",
      accrual_day: "1", leave_year_month: "4", leave_year_day: "1", carry_rule: "review", rate_basis: "origin_period_fee",
      advance_limit_hours: "200", exception_threshold_hours: "8", negative_threshold_hours: "8",
      reason: "Agreed accrual", evidence: "Synthetic", idempotency_key: "accruing-policy")
    facts = Payroll::PtoFacts.new(employment, month: run.period).call
    origin = ledger.decide!(period: run.period, kind: "advance", reason: "Approved advance", expected_digest: facts["digest"], idempotency_key: "advance")
    ledger.accrue!(through: Date.new(2026, 12, 1))
    expect(PayrollPtoAllocation.where(origin_entry: origin).sum(:minutes)).to eq(960)
    expect { save_fee(amount: "60000") }.to raise_error(Payroll::Workflow::Conflict, /PTO history/)
    row = ConsultantServiceFeeReview.sole
    attributes = row.attributes.except("id").merge("previous_review_id" => row.id, "idempotency_key" => "raw-consumed")
    ["ISO, MDY", "SQL, DMY"].each do |date_style|
      expect do
        ActiveRecord::Base.connection.transaction(requires_new: true) do
          ActiveRecord::Base.connection.execute("SET LOCAL DateStyle TO '#{date_style}'")
          ConsultantServiceFeeReview.insert_all!([attributes])
        end
      end.to raise_error(ActiveRecord::StatementInvalid, /protected PTO history/)
    end
    expect(origin.reload.rate_basis["origin_amount"]).to eq("50000.0")
  end

  it "rechecks a concurrent approved bank handoff after waiting for its run lock", :fee_concurrency do
    employment.update!(joined_at: "2020-01-01", resigned_at: "2026-11-13")
    ConsultantCompensation.create!(employment:, created_by: owner, effective_on: "2026-11-01", monthly_fee: "100000",
      hours_per_day: 8, weekdays: [1, 2, 3, 4, 5], payment_source: "india", legal_entity_name: legal_name, change_reason: "India funding")
    save_fee
    configure_synthetic_pto_policy
    record_synthetic_pto_treatment(unpaid_hours: "8")
    revision = Payroll::ConsultantRevision.new(run, actor: accounts).create!(consultants: [{ employment_id: employment.id, acknowledged: true }],
      cutoff: Date.current.iso8601, expected_digest: nil, idempotency_key: "concurrent-bank")
    workflow.approve!(actor: accounts, stage: "accounts", expected_digest: revision.digest)
    workflow.approve!(actor: owner, stage: "final", expected_digest: revision.digest)
    summary = service.summary(period: "2026-11")
    handoffs = Payroll::IndiaHandoff.new(run)
    preview = handoffs.preview(employment_id: employment.id)
    ready = Queue.new
    worker = nil
    run.with_lock do
      worker = Thread.new do
        ActiveRecord::Base.connection_pool.with_connection do |connection|
          ready << connection.select_value("SELECT pg_backend_pid()")
          Payroll::ServiceFeeReview.new(Employment.find(employment.id), actor: User.find(owner.id)).record!(period: "2026-11",
            amount: "60000", reason: "Competing fee", expected_digest: summary[:digest], expected_review_id: summary.dig(:current_review, :id),
            idempotency_key: "concurrent-review")
        rescue Payroll::Workflow::Conflict => error
          error
        end
      end
      Timeout.timeout(5) do
        pid = ready.pop
        sleep 0.01 until ActiveRecord::Base.connection.select_value("SELECT pg_backend_pid()=ANY(pg_blocking_pids(#{Integer(pid)}))")
      end
      handoffs.create!(actor: owner, employment_id: employment.id, expected_digest: revision.digest,
        accounts_email: "accounts@example.test", bank_confirmed: true, expected_bank_digest: preview[:report]["bank_digest"])
    end
    expect(Timeout.timeout(5) { worker.value }).to be_a(Payroll::Workflow::Conflict)
    expect(ConsultantServiceFeeReview.count).to eq(1)
    expect(PayrollIndiaHandoff.active.where(payroll_run: run).count).to eq(1)
  ensure
    worker&.kill if worker&.alive?
    worker&.join
  end

  it "refuses migration rollback after adoption without dropping its history" do
    employment.update!(joined_at: "2026-11-16")
    save_fee
    require Rails.root.join("db/migrate/20261109120000_create_consultant_service_fee_reviews")
    expect { CreateConsultantServiceFeeReviews.new.down }.to raise_error(ActiveRecord::IrreversibleMigration)
    expect(ConsultantServiceFeeReview.sole.amount_minor).to eq(5_000_000)
  end

  it "cannot create a monetary PTO origin from incomplete service-term coverage" do
    other = create(:employment, company:, joined_at: "2026-11-01", resigned_at: nil)
    ConsultantCompensation.create!(employment: other, created_by: owner, effective_on: "2026-11-16", monthly_fee: "100000",
      hours_per_day: 8, weekdays: [1, 2, 3, 4, 5], payment_source: "india", legal_entity_name: legal_name, change_reason: "Late initial terms")
    configure_synthetic_pto_policy(employment: other)
    facts = Payroll::PtoFacts.new(other, month: run.period).call
    expect do
      Payroll::PtoLedger.new(other, actor: owner).decide!(period: run.period, kind: "advance", reason: "Incomplete source",
        expected_digest: facts["digest"], idempotency_key: "uncovered-source")
    end.to raise_error(Payroll::ConsultantReview::InvalidInput, /service-period fee/)
  end

  it "does not release a future reservation on an unrelated origin when reviewing this month" do
    employment.update!(joined_at: "2026-11-16")
    work_entry.update!(work_date: "2026-11-16")
    save_fee
    configure_synthetic_pto_policy
    record_synthetic_pto_treatment
    later_accounts = create(:user, current_workspace: company)
    create(:employment, company:, user: later_accounts, joined_at: "2020-01-01", resigned_at: nil)
    later_accounts.add_role(:book_keeper, company)
    later = PayrollRun.create!(company:, period: Date.new(2026, 12, 1), currency: "INR", accounts_reviewer: later_accounts, final_reviewer: owner)
    create(:timesheet_entry, project: work_entry.project, user: worker, work_date: "2026-12-02", duration: 480, review_status: "approved")
    record_synthetic_pto_treatment(period: later.period, unpaid_hours: "8")
    revision = Payroll::ConsultantRevision.new(later, actor: later_accounts).create!(consultants: [{ employment_id: employment.id, acknowledged: true }],
      cutoff: Date.current.iso8601, expected_digest: nil, idempotency_key: "future-unrelated")
    later_workflow = Payroll::Workflow.new(later)
    later_workflow.approve!(actor: later_accounts, stage: "accounts", expected_digest: revision.digest)
    later_workflow.approve!(actor: owner, stage: "final", expected_digest: revision.digest)
    reservation = PayrollPtoRecovery.heads.find_by!(payroll_run: later, kind: "reserved")
    expect(reservation.payroll_pto_entry.period).to eq(later.period)
    current = Payroll::ServiceFeeReview.new(employment, actor: accounts)
    context = current.summary(period: "2026-11")
    current.record!(period: "2026-11", amount: "60000", reason: "Only November changed", expected_digest: context[:digest],
      expected_review_id: context.dig(:current_review, :id), idempotency_key: "only-november")
    expect(PayrollPtoRecovery.heads.find_by!(payroll_pto_entry: reservation.payroll_pto_entry).id).to eq(reservation.id)
    expect(later_workflow.status).to eq("approved")
  end

  it "rejects an otherwise identical replay by a different authorized actor" do
    employment.update!(joined_at: "2026-11-16")
    run
    input = { period: "2026-11", amount: "50000", reason: "Actor-bound review", expected_digest: service.summary(period: "2026-11")[:digest],
      expected_review_id: "", idempotency_key: "actor-bound-command" }
    service.record!(**input)
    expect do
      Payroll::ServiceFeeReview.new(employment, actor: accounts).record!(**input)
    end.to raise_error(Payroll::Workflow::Conflict)
    expect(ConsultantServiceFeeReview.sole.actor_id).to eq(owner.id)
  end

  it "rejects an out-of-scope reserved head as a domain conflict before the SQL guard" do
    employment.update!(joined_at: "2020-01-01")
    configure_synthetic_pto_policy
    record_synthetic_pto_treatment(unpaid_hours: "8")
    revision = Payroll::ConsultantRevision.new(run, actor: accounts).create!(consultants: [{ employment_id: employment.id, acknowledged: true }],
      cutoff: Date.current.iso8601, expected_digest: nil, idempotency_key: "current-source")
    earlier = PayrollRun.create!(company:, period: Date.new(2026, 10, 1), currency: "INR", accounts_reviewer: accounts, final_reviewer: owner)
    # SQL-valid legacy/corrupt history, deliberately not obtainable through Snapshot-approved preparation.
    attributes = revision.attributes.except("id").merge("payroll_run_id" => earlier.id, "idempotency_key" => "raw-earlier", "digest" => "a" * 64)
    raw_id = PayrollRevision.insert_all!([attributes], returning: ["id"]).rows.sole.sole
    entry = PayrollPtoEntry.heads.find_by!(employment:, case_key: "month:2026-11-01")
    PayrollPtoRecovery.create!(company:, employment:, payroll_pto_entry: entry, payroll_run: earlier,
      payroll_revision: PayrollRevision.find(raw_id), kind: "reserved", amount_minor: 100)
    expect { save_fee }.to raise_error(Payroll::Workflow::Conflict, /PTO history/)
    expect(ConsultantServiceFeeReview.count).to eq(0)
  end

  it "blocks final approval when a full-month holiday changes without a service-fee binding" do
    employment.update!(joined_at: "2020-01-01")
    calendar = create(:holiday, company:, year: 2026)
    holiday = create(:holiday_info, holiday: calendar, date: "2026-11-05", category: :optional)
    create(:timeoff_entry, user: worker, leave_type: nil, holiday_info: holiday, leave_date: holiday.date)
    configure_synthetic_pto_policy
    record_synthetic_pto_treatment(unpaid_hours: "8")
    revision = Payroll::ConsultantRevision.new(run, actor: accounts).create!(consultants: [{ employment_id: employment.id, acknowledged: true }],
      cutoff: Date.current.iso8601, expected_digest: nil, idempotency_key: "before-holiday")
    expect(revision.payroll_payload.dig("lines", 0, "preparation")).not_to have_key("service_fee_review")
    workflow.approve!(actor: accounts, stage: "accounts", expected_digest: revision.digest)
    holiday.update!(date: "2026-11-06")
    expect(Payroll::ServicePeriod.new(employment, month: run.period).blockers).to include("holiday_date_requires_review")
    expect(revision.approval_issues).to include("invalid_snapshot")
    expect do
      workflow.approve!(actor: owner, stage: "final", expected_digest: revision.digest)
    end.to raise_error(ActiveRecord::RecordInvalid)
    expect(revision.payroll_approvals.count).to eq(1)
  end

  it "rejects a recomputed valid calculator snapshot with a forged scheduled basis or omitted PTO" do
    employment.update!(joined_at: "2020-01-01", resigned_at: "2026-11-13")
    save_fee
    configure_synthetic_pto_policy
    record_synthetic_pto_treatment(unpaid_hours: "8")
    revision = Payroll::ConsultantRevision.new(run, actor: accounts).create!(consultants: [{ employment_id: employment.id, acknowledged: true }],
      cutoff: Date.current.iso8601, expected_digest: nil, idempotency_key: "bound-minutes")
    payload = revision.payroll_payload.deep_dup
    line = payload.fetch("lines").sole
    original = line.fetch("calculation_snapshot")
    input = original.fetch("input").merge("basis_quantity" => "9600", "paid_quantity" => "9120")
    forged = PayrollCalculation::Calculator.new(policy: original.fetch("policy"), input:).call.deep_dup
    expect(PayrollCalculation::Calculator.verify_snapshot?(forged)).to be(true)
    line["calculation_snapshot"] = forged
    line["amounts"].merge!("base_minor" => 4_750_000, "net_minor" => 4_750_000)
    expect(Payroll::Snapshot.new(run, payload, actor_id: accounts.id).approval_issues).to include("calculation_missing_or_inconsistent")
    line["source_snapshot"].delete("pto")
    expect(Payroll::Snapshot.new(run, payload, actor_id: accounts.id).valid?).to be(false)
  end

  it "rebuilds PTO facts after waiting for a concurrent fee replacement", :fee_concurrency do
    employment.update!(joined_at: "2026-11-16")
    work_entry.update!(work_date: "2026-11-16")
    save_fee
    configure_synthetic_pto_policy
    old_facts = Payroll::PtoFacts.new(employment, month: run.period).call
    ready = Queue.new
    worker_thread = nil
    run.with_lock do
      worker_thread = Thread.new do
        ActiveRecord::Base.connection_pool.with_connection do |connection|
          ready << connection.select_value("SELECT pg_backend_pid()")
          Payroll::PtoLedger.new(Employment.find(employment.id), actor: User.find(owner.id)).decide!(period: run.period,
            kind: "advance", reason: "Old reviewed fee", expected_digest: old_facts["digest"], idempotency_key: "stale-fee-facts")
        rescue Payroll::Workflow::Conflict => error
          error
        end
      end
      Timeout.timeout(5) do
        pid = ready.pop
        sleep 0.01 until ActiveRecord::Base.connection.select_value("SELECT pg_backend_pid()=ANY(pg_blocking_pids(#{Integer(pid)}))")
      end
      save_fee(amount: "60000")
    end
    expect(Timeout.timeout(5) { worker_thread.value }).to be_a(Payroll::Workflow::Conflict)
    expect(PayrollPtoEntry.where(employment:, case_key: "month:2026-11-01")).to be_empty
    expect(ConsultantServiceFeeReview.where(employment:).count).to eq(2)
  ensure
    worker_thread&.kill if worker_thread&.alive?
    worker_thread&.join
  end
end
