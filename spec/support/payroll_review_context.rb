# frozen_string_literal: true

RSpec.shared_context "persisted synthetic payroll review" do
  let(:company) { create(:company, base_currency: "INR") }
  let(:accounts) { create(:user) }
  let(:owner) { create(:user) }
  let(:worker) { create(:user) }
  let!(:employment) { create(:employment, company:, user: worker, resigned_at: nil) }
  let!(:work_entry) do
    project = create(:project, client: create(:client, company:))
    create(:timesheet_entry, user: worker, project:, work_date: Date.new(2026, 11, 2), duration: 480)
  end
  let(:run) do
    PayrollRun.create!(company:, period: Date.new(2026, 11, 1), currency: "INR",
      accounts_reviewer: accounts, final_reviewer: owner)
  end
  let(:workflow) { Payroll::Workflow.new(run) }
  let(:payload) do
    {
      "schema_version" => 1, "company_id" => company.id, "period" => "2026-11-01", "currency" => "INR",
      "policies" => Payroll::Snapshot::POLICIES.index_with do |kind|
        { "version" => "synthetic.#{kind}.v1", "effective_from" => "2026-11-01", "effective_to" => "2026-11-30" }
      end,
      "exceptions" => [], "lines" => [{
        "employment_id" => employment.id, "pay_type" => "employee", "currency" => "INR",
        "source_snapshot" => nil, "source_resolutions" => [], "calculation_snapshot" => nil,
        "amounts" => { "base_minor" => 10_000, "extras_minor" => 200, "reimbursements_minor" => 100,
                      "deductions_minor" => 50, "net_minor" => 10_250 },
        "extras" => [{ "code" => "synthetic_bonus", "amount_minor" => 200, "currency" => "INR" }],
        "reimbursements" => [{ "code" => "synthetic_expense", "amount_minor" => 100, "currency" => "INR" }],
        "deductions" => [{ "code" => "synthetic_adjustment", "amount_minor" => 50, "currency" => "INR" }]
      }]
    }
  end

  before do
    accounts.update!(current_workspace: company)
    owner.update!(current_workspace: company)
    create(:employment, company:, user: accounts, resigned_at: nil)
    create(:employment, company:, user: owner, resigned_at: nil)
    accounts.add_role(:book_keeper, company)
    owner.add_role(:owner, company)
    payload["lines"][0].values_at("extras", "reimbursements", "deductions").flatten.each do |entry|
      entry.merge!("origin_period" => "2026-11-01", "source_reference" => "synthetic.adjustment", "reason_code" => "reviewed")
    end
    source = PayrollSources::MonthlyFacts.new(company:, employment:, actor: accounts, month: "2026-11",
      policy_versions: { pay: "synthetic.pay.v1", attendance: "synthetic.proration.v1" }).call
    policy = JSON.parse(File.read(Rails.root.join("spec/fixtures/payroll/synthetic_cases.json"))).fetch("policy")
    policy["version"] = "synthetic.pay.v1"
    input = {
      "company_id" => company.id.to_s, "person_id" => worker.id.to_s, "period" => "2026-11", "engagement_type" => "employee",
      "source_currency" => "INR", "settlement_currency" => "INR",
      "compensation" => { "basis" => "monthly", "amount" => "100", "effective_from" => "2026-11-01", "effective_to" => "2026-11-30" },
      "paid_quantity" => "1", "basis_quantity" => "1", "quantity_source" => source["digest"],
      "adjustments" => [["synthetic_bonus", "bonus", "2"], ["synthetic_expense", "reimbursement", "1"],
                        ["synthetic_adjustment", "other_deduction", "0.5"]].map do |code, kind, amount|
        { "code" => code, "kind" => kind, "amount" => amount, "currency" => "INR", "origin_period" => "2026-11",
          "source" => "synthetic.adjustment", "reason" => "reviewed", "reviewed" => true }
      end
    }
    policy["rounding"].each_value { |profile| profile["digits"] = 2 }
    payload["lines"][0].merge!("source_snapshot" => source.deep_dup,
      "calculation_snapshot" => PayrollCalculation::Calculator.new(policy:, input:).call.deep_dup,
      "source_resolutions" => [{ "code" => "no_timeoff_entries", "decision" => "verified_zero_pto", "reason_code" => "synthetic_zero_leave",
                                "source_digest" => source["digest"], "actor_id" => accounts.id, "source_id" => nil }])
  end
end
