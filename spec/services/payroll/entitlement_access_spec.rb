# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Payroll tenant entitlement access" do
  include_context "persisted synthetic payroll review"

  let!(:revision) { workflow.revise!(actor: accounts, payload:, idempotency_key: "entitlement-fixture", expected_digest: nil) }

  before { allow(ENV).to receive(:[]).with("MIRU_PAYROLL_ENABLED").and_return("false") }

  it "blocks every persisted workflow operation when disabled after construction" do
    expect { workflow.status }.to raise_error(Payroll::Entitlement::NotEnabled)
    expect { workflow.revise!(actor: accounts, payload:, idempotency_key: "disabled", expected_digest: revision.digest) }
      .to raise_error(Payroll::Entitlement::NotEnabled)
    expect { workflow.approve!(actor: owner, stage: "final", expected_digest: revision.digest) }
      .to raise_error(Payroll::Entitlement::NotEnabled)
    expect(run.payroll_revisions.count).to eq(1)
    expect(revision.payroll_approvals.count).to eq(0)
  end

  it "blocks direct review, snapshot and source entry points" do
    expect { run.current_revision }.to raise_error(Payroll::Entitlement::NotEnabled)
    expect(run.eligible_actor?(owner, "final")).to be(false)
    presenter = Payroll::ReviewSummary.new(run)
    [:summary, :detail, :preflight].each do |method|
      expect { presenter.public_send(method) }.to raise_error(Payroll::Entitlement::NotEnabled)
    end
    expect { Payroll::Snapshot.new(run, payload).valid? }.to raise_error(Payroll::Entitlement::NotEnabled)
    expect { revision.approval_issues }.to raise_error(Payroll::Entitlement::NotEnabled)
    source = PayrollSources::MonthlyFacts.new(company:, employment:, actor: accounts, month: "2026-11")
    expect { source.call }.to raise_error(Payroll::Entitlement::NotEnabled)
    expect { PayrollSources::MonthlyFacts.current_snapshot?(payload.dig("lines", 0, "source_snapshot"), company:, employment:) }
      .to raise_error(Payroll::Entitlement::NotEnabled)
  end

  it "blocks direct persisted model writes before normal validation" do
    expect { PayrollRun.create!(company:, accounts_reviewer: accounts, final_reviewer: owner, period: Date.new(2026, 12, 1), currency: "INR") }
      .to raise_error(Payroll::Entitlement::NotEnabled)
    expect { PayrollRevision.new(payroll_run: run, created_by: accounts).valid? }.to raise_error(Payroll::Entitlement::NotEnabled)
    expect { PayrollApproval.new(payroll_revision: revision, actor: owner, stage: "final").valid? }
      .to raise_error(Payroll::Entitlement::NotEnabled)
  end
end
