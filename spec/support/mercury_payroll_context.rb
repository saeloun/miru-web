# frozen_string_literal: true

RSpec.shared_context "explicit synthetic PTO policy" do
  def configure_synthetic_pto_policy(employment: self.employment, actor: owner)
    Payroll::PtoLedger.new(employment, actor:).configure!(
      effective_on: "2026-11-01", opening_on: "2026-11-01", opening_hours: "0", monthly_accrual_hours: "0",
      accrual_day: "1", leave_year_month: "4", leave_year_day: "1", carry_rule: "review", rate_basis: "origin_period_fee",
      advance_limit_hours: "200", exception_threshold_hours: "8", negative_threshold_hours: "8",
      reason: "Approved synthetic policy for explicit absence decisions", evidence: "Synthetic reconciled opening",
      idempotency_key: "synthetic-policy")
  end

  def record_synthetic_pto_treatment(unpaid_hours: "0", period: run.period, employment: self.employment, actor: owner)
    facts = Payroll::PtoFacts.new(employment, month: period).call
    gap = facts.fetch("gap_hours").to_d
    return if gap.zero?

    unpaid = unpaid_hours.to_d
    allocations = []
    allocations << { kind: "unpaid", hours: unpaid.to_s("F") } if unpaid.positive?
    allocations << { kind: "defer", hours: (gap - unpaid).to_s("F") } if gap > unpaid
    Payroll::PtoLedger.new(employment, actor:).allocate!(period:, allocations:,
      reason: "Synthetic explicitly reviewed unpaid hours and deferred remaining absence",
      expected_digest: facts.fetch("digest"), idempotency_key: SecureRandom.uuid)
  end
end

RSpec.shared_context "reviewed mercury consultant payroll" do
  include_context "approved mercury consultant payroll"

  before do
    configure_synthetic_pto_policy
    record_synthetic_pto_treatment
  end
end

RSpec.shared_context "approved mercury consultant payroll" do
  include_context "explicit synthetic PTO policy"

  let(:company) { create(:company, base_currency: "INR") }
  let(:accounts) { create(:user) }
  let(:owner) { create(:user) }
  let(:worker) { create(:user) }
  let!(:employment) { create(:employment, company:, user: worker, resigned_at: nil) }
  let!(:work_entry) do
    project = create(:project, client: create(:client, company:))
    create(:timesheet_entry, user: worker, project:, work_date: Date.new(2026, 11, 2), duration: 480)
  end
  let(:account_id) { "11111111-1111-4111-8111-111111111111" }
  let(:recipient_id) { "22222222-2222-4222-8222-222222222222" }
  let(:request_id) { "33333333-3333-4333-8333-333333333333" }
  let(:mercury_base) { "https://api-sandbox.mercury.com/api/v1" }
  let(:token) { "secret-token:mercury_sandbox_synthetic" }
  let(:legal_name) { "Synthetic US LLC" }
  let(:bank_details) do
    { "bank_account_name" => "Synthetic Consultant", "bank_name" => "Synthetic Bank", "bank_branch" => "Synthetic Branch",
      "bank_account_number" => "123456789012", "bank_ifsc" => "SYNT0000001", "bank_swift" => "SYNTINBBXXX" }
  end
  let(:net_minor) { 6_250_000 }
  let(:run) do
    PayrollRun.create!(company:, period: Date.new(2026, 11, 1), currency: "INR",
      accounts_reviewer: accounts, final_reviewer: owner)
  end
  let(:workflow) { Payroll::Workflow.new(run) }
  let(:quote) { { reference_rate: "85.50", source: "Synthetic reference", observed_at: 1.hour.ago.iso8601 } }

  before do
    enable_synthetic_payroll(company.id)
    allow(ENV).to receive(:[]).with("MIRU_PAYROLL_MERCURY_WRITE_ENVIRONMENT").and_return("sandbox")
    [accounts, owner].each do |user|
      user.update!(current_workspace: company)
      create(:employment, company:, user:, resigned_at: nil)
    end
    accounts.add_role(:book_keeper, company)
    owner.add_role(:owner, company)
    EmployeeRecord.create!(employment:, private_details: bank_details)
    ConsultantCompensation.create!(employment:, created_by: owner, effective_on: Date.new(2026, 11, 1), monthly_fee: 62_500,
      hours_per_day: 8, weekdays: [1, 2, 3, 4, 5], payment_source: "mercury_us", legal_entity_name: legal_name, change_reason: "Synthetic terms")
  end

  def synthetic_payload(amount_minor: net_minor, pay_type: "consultant", reimbursements: [])
    match_terms_to(amount_minor)
    source = PayrollSources::MonthlyFacts.new(company:, employment:, actor: accounts, month: "2026-11",
      policy_versions: { pay: "synthetic.pay.v1", attendance: "synthetic.proration.v1" }).call
    policy = JSON.parse(File.read(Rails.root.join("spec/fixtures/payroll/synthetic_cases.json"))).fetch("policy")
    policy["version"] = "synthetic.pay.v1"
    policy["rounding"].each_value { |profile| profile["digits"] = 2 }
    reimbursement_minor = reimbursements.sum
    input = {
      "company_id" => company.id.to_s, "person_id" => worker.id.to_s, "period" => "2026-11", "engagement_type" => pay_type,
      "source_currency" => "INR", "settlement_currency" => "INR",
      "compensation" => { "basis" => "monthly", "amount" => format("%.2f", amount_minor / 100.0),
                          "effective_from" => "2026-11-01", "effective_to" => "2026-11-30" },
      "paid_quantity" => "1", "basis_quantity" => "1", "quantity_source" => source["digest"],
      "adjustments" => reimbursements.map do |minor|
        { "code" => "synthetic_expense", "kind" => "reimbursement", "amount" => format("%.2f", minor / 100.0), "currency" => "INR",
          "origin_period" => "2026-11", "source" => "synthetic.adjustment", "reason" => "reviewed", "reviewed" => true }
      end
    }
    if pay_type == "consultant" && source.dig("pto", "policy_id")
      pto = source.fetch("pto")
      expected_minutes = pto.fetch("expected_hours").to_d * 60
      input["paid_quantity"] = (expected_minutes - pto.fetch("unpaid_minutes").to_d).to_s("F")
      input["basis_quantity"] = expected_minutes.to_s("F")
      policy["paid_quantity_name"] = "scheduled minutes less confirmed unpaid minutes"
      policy["basis_quantity_name"] = "scheduled minutes"
    end
    {
      "schema_version" => 1, "company_id" => company.id, "period" => "2026-11-01", "currency" => "INR",
      "policies" => Payroll::Snapshot::POLICIES.index_with do |kind|
        { "version" => "synthetic.#{kind}.v1", "effective_from" => "2026-11-01", "effective_to" => "2026-11-30" }
      end,
      "exceptions" => [], "lines" => [{
        "employment_id" => employment.id, "pay_type" => pay_type, "currency" => "INR",
        "source_snapshot" => source.deep_dup,
        "calculation_snapshot" => PayrollCalculation::Calculator.new(policy:, input:).call.deep_dup,
        "source_resolutions" => [{ "code" => "no_timeoff_entries", "decision" => "verified_zero_pto", "reason_code" => "synthetic_zero_leave",
                                  "source_digest" => source["digest"], "actor_id" => accounts.id, "source_id" => nil }],
        "amounts" => { "base_minor" => amount_minor, "extras_minor" => 0, "reimbursements_minor" => reimbursement_minor,
                      "deductions_minor" => 0, "net_minor" => amount_minor + reimbursement_minor },
        "extras" => [], "deductions" => [],
        "reimbursements" => reimbursements.map do |minor|
          { "code" => "synthetic_expense", "amount_minor" => minor, "currency" => "INR", "origin_period" => "2026-11-01",
            "source_reference" => "synthetic.adjustment", "reason_code" => "reviewed" }
        end
      }]
    }
  end

  def match_terms_to(amount_minor)
    latest = employment.consultant_compensations.order(effective_on: :desc, id: :desc).first
    return if latest.monthly_fee * 100 == amount_minor

    ConsultantCompensation.create!(employment:, created_by: owner, effective_on: latest.effective_on, monthly_fee: BigDecimal(amount_minor) / 100,
      hours_per_day: 8, weekdays: [1, 2, 3, 4, 5], payment_source: latest.payment_source, legal_entity_name: legal_name, change_reason: "Synthetic amount")
  end

  def synthetic_india_bank_digest
    Payroll::MercurySetup.digest(Payroll::IndiaReport.bank_details(employment.reload).sort.to_h)
  end

  def approve_revision(payload: synthetic_payload, key: "synthetic-#{SecureRandom.hex(4)}", parent: nil)
    revision = workflow.revise!(actor: accounts, payload:, idempotency_key: key, expected_digest: parent)
    workflow.approve!(actor: accounts, stage: "accounts", expected_digest: revision.digest)
    workflow.approve!(actor: owner, stage: "final", expected_digest: revision.digest)
    revision
  end

  def mercury_json(value, status: 200)
    { status:, body: JSON.generate(value), headers: { "Content-Type" => "application/json" } }
  end

  def mercury_account(overrides = {})
    { "id" => account_id, "name" => "Synthetic Checking", "accountNumber" => "9876543210", "routingNumber" => "121000000",
      "legalBusinessName" => legal_name, "status" => "active", "type" => "mercury", "availableBalance" => 100_000.25,
      "currentBalance" => 100_000.25, "kind" => "checking" }.merge(overrides)
  end

  def mercury_recipient(overrides = {})
    { "id" => recipient_id, "name" => "Synthetic Consultant", "status" => "active", "emails" => [], "attachments" => [],
      "defaultPaymentMethod" => "internationalWire",
      "internationalWireRoutingInfo" => { "iban" => "123456789012", "swiftCode" => "SYNTINBBXXX",
                                          "countrySpecific" => { "india" => { "ifscCode" => "SYNT0000001" } } } }.merge(overrides)
  end

  def mercury_request(overrides = {})
    { "accountId" => account_id, "requestId" => request_id, "recipientId" => recipient_id, "paymentMethod" => "internationalWire",
      "amount" => 744.05, "memo" => nil, "status" => "pendingApproval", "requestedByUserId" => "44444444-4444-4444-8444-444444444444",
      "reviews" => [], "createdAt" => Time.current.utc.iso8601, "scheduledSendDate" => nil,
      "numberOfApproversRequired" => 1, "requesterMayApprove" => false }.merge(overrides)
  end

  def mercury_transaction(overrides = {})
    { "id" => "55555555-5555-4555-8555-555555555555", "amount" => -744.05, "status" => "pending", "kind" => "outgoingPayment",
      "accountId" => account_id, "requestId" => request_id, "createdAt" => Time.current.utc.iso8601 }.merge(overrides)
  end

  def stub_mercury_reads(account: mercury_account, recipient: mercury_recipient)
    stub_request(:get, "#{mercury_base}/accounts?limit=1000")
      .to_return(mercury_json({ "accounts" => [account], "page" => { "nextPage" => nil, "previousPage" => nil } }))
    stub_request(:get, "#{mercury_base}/account/#{account_id}").to_return(mercury_json(account))
    stub_request(:get, "#{mercury_base}/recipient/#{recipient_id}").to_return(mercury_json(recipient))
  end

  def stub_mercury_write(response = mercury_json(mercury_request))
    stub_request(:post, "#{mercury_base}/account/#{account_id}/request-send-money").to_return(response)
  end

  def verified_connection
    stub_mercury_reads
    Payroll::MercurySetup.new(company).save!(actor: owner, attributes: { api_token: token, environment: "sandbox",
      source_account_id: account_id, expected_legal_business_name: legal_name })
    Payroll::MercurySetup.new(company).verify!(actor: owner)
  end

  def linked_recipient(beneficiary: "consultant", id: recipient_id)
    Payroll::MercurySetup.new(company).link_recipient!(actor: owner, employment_id: employment.id, recipient_id: id, beneficiary:)
  end

  def ready_payment
    verified_connection
    linked_recipient
    Payroll::MercuryPayment.new(run)
  end

  def prepared_instruction(revision: approve_revision)
    ready_payment.prepare!(actor: owner, employment_id: employment.id, expected_digest: revision.digest, quote:).first
  end

  def accepted_instruction(revision: approve_revision, response: mercury_request)
    instruction = prepared_instruction(revision:)
    stub_mercury_reads
    stub_mercury_write(mercury_json(response))
    Payroll::MercuryPayment.new(run).submit!(actor: owner, instruction_id: instruction.id, expected_digest: instruction.frozen_digest)
  end
end
