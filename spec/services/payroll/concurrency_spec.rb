# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Payroll revision concurrency" do
  it "serializes concurrent writers so exactly one can extend a reviewed head" do
    run_id, actor_id, payload = Thread.new do
      ActiveRecord::Base.connection_pool.with_connection do
        company = create(:company, base_currency: "INR")
        enable_synthetic_payroll(company.id)
        accounts = create(:user, current_workspace: company)
        owner = create(:user, current_workspace: company)
        [accounts, owner].each { |user| create(:employment, company:, user:, resigned_at: nil) }
        accounts.add_role(:book_keeper, company)
        owner.add_role(:owner, company)
        run = PayrollRun.create!(company:, accounts_reviewer: accounts, final_reviewer: owner,
          period: Date.new(2026, 11, 1), currency: "INR")
        employment = Employment.find_by!(company:, user: accounts)
        snapshot = {
          "schema_version" => 1, "company_id" => company.id, "period" => "2026-11-01", "currency" => "INR",
          "policies" => {}, "exceptions" => ["integration_pending"], "lines" => [{
            "employment_id" => employment.id, "pay_type" => "employee", "currency" => "INR",
            "source_snapshot" => nil, "calculation_snapshot" => nil, "source_resolutions" => [],
            "amounts" => { "base_minor" => 100, "extras_minor" => 0, "reimbursements_minor" => 0,
                          "deductions_minor" => 0, "net_minor" => 100 },
            "extras" => [], "reimbursements" => [], "deductions" => []
          }]
        }
        [run.id, accounts.id, snapshot]
      end
    end.value
    ready = Queue.new
    release = Queue.new
    threads = 2.times.map do |index|
      Thread.new do
        ActiveRecord::Base.connection_pool.with_connection do
          workflow = Payroll::Workflow.new(PayrollRun.find(run_id))
          actor = User.find(actor_id)
          ready << true
          release.pop
          begin
            workflow.revise!(actor:, payload:, idempotency_key: "concurrent-#{index}", expected_digest: nil)
            "created"
          rescue Payroll::Workflow::Conflict
            "conflict"
          end
        end
      end
    end
    2.times { ready.pop }
    2.times { release << true }
    expect(threads.map(&:value).sort).to eq(%w[conflict created])
    expect(PayrollRevision.where(payroll_run_id: run_id).count).to eq(1)
  ensure
    DatabaseCleaner.clean
    Thread.new do
      ActiveRecord::Base.connection_pool.with_connection do
        DatabaseCleaner.clean_with(:truncation, except: %w[ar_internal_metadata schema_migrations])
      end
    end.value
  end
end
