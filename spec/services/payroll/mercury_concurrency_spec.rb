# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Mercury payroll concurrency" do
  include_context "explicit synthetic PTO policy"

  self.use_transactional_tests = false if respond_to?(:use_transactional_tests=)

  def on_thread(&block)
    Thread.new { ActiveRecord::Base.connection_pool.with_connection(&block) }.value
  end

  it "sends exactly one approval request for concurrent submissions and reserves a claim once" do
    company = owner = accounts = worker = employment = run = nil
    account_id = "11111111-1111-4111-8111-111111111111"
    recipient_id = "22222222-2222-4222-8222-222222222222"
    base = "https://api-sandbox.mercury.com/api/v1"
    json = ->(value) { { status: 200, body: JSON.generate(value), headers: { "Content-Type" => "application/json" } } }

    on_thread do
      company = create(:company, base_currency: "INR")
      enable_synthetic_payroll(company.id)
      allow(ENV).to receive(:[]).with("MIRU_PAYROLL_MERCURY_WRITE_ENVIRONMENT").and_return("sandbox")
      accounts, owner, worker = create(:user), create(:user), create(:user)
      [accounts, owner].each { |user| user.update!(current_workspace: company); create(:employment, company:, user:, resigned_at: nil) }
      employment = create(:employment, company:, user: worker, resigned_at: nil)
      accounts.add_role(:book_keeper, company)
      owner.add_role(:owner, company)
      project = create(:project, client: create(:client, company:))
      create(:timesheet_entry, user: worker, project:, work_date: Date.new(2026, 11, 2), duration: 480)
      EmployeeRecord.create!(employment:, private_details: { "bank_account_name" => "Synthetic Consultant", "bank_name" => "Synthetic Bank",
        "bank_country" => "IN", "bank_account_currency" => "INR", "bank_account_number" => "123456789012",
        "bank_ifsc" => "SYNT0000001", "bank_swift" => "SYNTINBBXXX" })
      ConsultantCompensation.create!(employment:, created_by: owner, effective_on: Date.new(2026, 11, 1), monthly_fee: 62_500, hours_per_day: 8,
        weekdays: [1, 2, 3, 4, 5], payment_source: "mercury_us", legal_entity_name: "Synthetic US LLC", change_reason: "Synthetic")
      review_synthetic_billing_identity(employment:, reviewer: owner)
      run = PayrollRun.create!(company:, period: Date.new(2026, 11, 1), currency: "INR", accounts_reviewer: accounts, final_reviewer: owner)
    end

    account = { "id" => account_id, "name" => "Checking", "accountNumber" => "9876543210", "legalBusinessName" => "Synthetic US LLC",
                "status" => "active", "type" => "mercury", "availableBalance" => 100_000.25 }
    recipient = { "id" => recipient_id, "name" => "Synthetic Consultant", "status" => "active",
                  "internationalWireRoutingInfo" => { "iban" => "123456789012", "swiftCode" => "SYNTINBBXXX",
                                                      "countrySpecific" => { "india" => { "ifscCode" => "SYNT0000001" } } } }
    stub_request(:get, "#{base}/accounts?limit=1000").to_return(json.call({ "accounts" => [account], "page" => { "nextPage" => nil, "previousPage" => nil } }))
    stub_request(:get, "#{base}/account/#{account_id}").to_return(json.call(account))
    stub_request(:get, "#{base}/recipient/#{recipient_id}").to_return(json.call(recipient))
    post = stub_request(:post, "#{base}/account/#{account_id}/request-send-money").to_return(json.call(
      "accountId" => account_id, "requestId" => "33333333-3333-4333-8333-333333333333", "recipientId" => recipient_id,
      "paymentMethod" => "internationalWire", "amount" => 744.05, "status" => "pendingApproval", "requestedByUserId" => "44444444-4444-4444-8444-444444444444",
      "reviews" => [], "createdAt" => Time.current.utc.iso8601
    ))

    leg = on_thread do
      employment.update!(joined_at: Date.new(2020, 1, 1))
      configure_synthetic_pto_policy(employment:, actor: owner)
      record_synthetic_pto_treatment(employment:, actor: owner, period: run.period)
      revision = Payroll::ConsultantRevision.new(run, actor: accounts).create!(
        consultants: [{ employment_id: employment.id, acknowledged: true }], cutoff: company.resolved_time_zone.today.iso8601, expected_digest: nil, idempotency_key: "c1"
      )
      workflow = Payroll::Workflow.new(run)
      workflow.approve!(actor: accounts, stage: "accounts", expected_digest: revision.digest)
      workflow.approve!(actor: owner, stage: "final", expected_digest: revision.digest)
      setup = Payroll::MercurySetup.new(company)
      setup.save!(actor: owner, attributes: { api_token: "secret-token:synthetic", environment: "sandbox", source_account_id: account_id,
        expected_legal_business_name: "Synthetic US LLC" })
      setup.verify!(actor: owner)
      setup.link_recipient!(actor: owner, employment_id: employment.id, recipient_id:)
      Payroll::MercuryPayment.new(run).prepare!(actor: owner, employment_id: employment.id, expected_digest: revision.digest,
        quote: { reference_rate: "85.50", source: "Synthetic", observed_at: 1.hour.ago.iso8601 }).first
    end

    ready = Queue.new
    release = Queue.new
    results = 2.times.map do
      Thread.new do
        ActiveRecord::Base.connection_pool.with_connection do
          service = Payroll::MercuryPayment.new(PayrollRun.find(run.id))
          actor = User.find(owner.id)
          ready << true
          release.pop
          service.submit!(actor:, instruction_id: leg.id, expected_digest: leg.frozen_digest)
          "sent"
        rescue Payroll::MercuryPayment::Blocked
          "blocked"
        end
      end
    end
    2.times { ready.pop }
    2.times { release << true }
    outcomes = results.map(&:value)
    expect(outcomes.count("sent")).to eq(1)
    expect(post).to have_been_requested.once
    expect(leg.reload.submission_attempts).to eq(1)
  ensure
    DatabaseCleaner.clean
    Thread.new do
      ActiveRecord::Base.connection_pool.with_connection do
        DatabaseCleaner.clean_with(:truncation, except: %w[ar_internal_metadata schema_migrations])
      end
    end.value
  end
end
