# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Consultant invoice authorization" do
  include_context "approved mercury consultant payroll"
  around { |example| travel_to(Time.utc(2026, 12, 5, 12)) { example.run } }
  let(:service) { Payroll::InvoiceAuthorization.new(employment, actor: worker) }
  before do
    worker.update!(current_workspace: company)
    employment.update!(joined_at: "2020-01-01")
  end

  def record(action, **extra)
    current = service.summary
    service.record!(action:, expected_event_id: current.dig(:current_event, :id).to_s,
      statement_digest: current.dig(:statement, :digest), idempotency_key: SecureRandom.uuid, **extra)
  end

  it "records an explicit self grant, withdrawal and regrant without issuing an invoice or payment" do
    initial = service.summary
    expect(initial).to include(status: "not_granted", can_grant: true, can_withdraw: false)
    granted = record("grant")
    expect(granted).to include(status: "granted", can_grant: false, can_withdraw: true)
    expect(granted[:current_event]).to include(action: "grant", actor_id: worker.id.to_s,
      statement_text: "I authorize Miru to generate invoices on my behalf for my consultancy services recorded in this workspace. I can withdraw this authorization for future invoices.")
    withdrawn = record("withdraw")
    expect(withdrawn).to include(status: "withdrawn", can_grant: true, can_withdraw: false)
    expect(record("grant")[:history].pluck(:action)).to eq(%w[grant withdraw grant])
    expect(PayrollPaymentInstruction.count).to eq(0)
    expect(Invoice.count).to eq(0)
  end

  it "retains own history and withdrawal after exit while denying a new grant" do
    record("grant")
    employment.update!(resigned_at: "2026-11-30")
    expect(service.summary).to include(status: "granted", can_grant: false, can_withdraw: true)
    expect(service.authorized?).to be(true)
    expect(record("withdraw")[:status]).to eq("withdrawn")
    expect { record("grant") }.to raise_error(Payroll::Workflow::NotAuthorized)
    expect(ConsultantInvoiceAuthorization.count).to eq(2)
  end

  it "preserves self revocation and its retries when payroll is disabled, without permitting issuance or observer access" do
    granted = record("grant")
    allow(ENV).to receive(:[]).with("MIRU_PAYROLL_ENABLED").and_return("false")
    expect(service.summary).to include(status: "granted", can_grant: false, can_withdraw: true)
    expect(service.authorized?).to be(false)
    expect(service.receipt).to be_nil
    expect { Payroll::InvoiceAuthorization.new(employment, actor: owner).summary }.to raise_error(Payroll::Workflow::NotAuthorized)
    input = { action: "withdraw", expected_event_id: granted.dig(:current_event, :id), statement_digest: "", idempotency_key: "disabled-withdrawal" }
    withdrawn = service.record!(**input)
    expect(withdrawn).to include(status: "withdrawn", can_grant: false, can_withdraw: false)
    expect(service.record!(**input).dig(:recorded_event, :id)).to eq(withdrawn.dig(:recorded_event, :id))
    expect { record("grant") }.to raise_error(Payroll::Workflow::NotAuthorized)
    expect(ConsultantInvoiceAuthorization.count).to eq(2)
    ConsultantInvoiceAuthorizationPolicy.new(worker, employment).tap do |policy|
      expect(policy.show?).to be(true)
      expect(policy.record?).to be(true)
    end
    fresh = create(:employment, company:, user: create(:user, current_workspace: company), joined_at: "2020-01-01", resigned_at: nil)
    expect(ConsultantInvoiceAuthorizationPolicy.new(fresh.user, fresh).show?).to be(false)
    expect(ConsultantInvoiceAuthorizationPolicy.new(fresh.user, fresh).record?).to be(false)
  end

  it "allows an active owner or assigned accounts to read but never proxy consent" do
    run
    [owner, accounts].each do |reader|
      proxy = Payroll::InvoiceAuthorization.new(employment, actor: reader)
      expect(proxy.summary[:can_grant]).to be(false)
      expect do
        proxy.record!(action: "grant", expected_event_id: "", statement_digest: proxy.summary.dig(:statement, :digest), idempotency_key: "proxy")
      end.to raise_error(Payroll::Workflow::NotAuthorized)
    end
  end

  it "returns its original receipt without promoting a grant replay after withdrawal" do
    initial = service.summary
    input = { action: "grant", expected_event_id: "", statement_digest: initial.dig(:statement, :digest), idempotency_key: "original-grant" }
    first = service.record!(**input)
    record("withdraw")
    replay = service.record!(**input)
    expect(replay).to include(status: "withdrawn")
    expect(replay[:recorded_event]).to include(id: first.dig(:recorded_event, :id), current: false)
    expect(ConsultantInvoiceAuthorization.count).to eq(2)
    expect { service.record!(**input.merge(expected_event_id: replay.dig(:current_event, :id))) }.to raise_error(Payroll::Workflow::Conflict)
  end

  it "requires new wording for reauthorization but withdraws the original grant without reaccepting it" do
    original = record("grant")[:current_event]
    stub_const("Payroll::InvoiceAuthorization::STATEMENT_VERSION", "miru-consultant-invoice-authorization-v2")
    stub_const("Payroll::InvoiceAuthorization::STATEMENT_TEXT", "A revised explicit statement")
    expect(service.summary).to include(status: "reauthorization_required", can_grant: true, can_withdraw: true)
    expect(service.authorized?).to be(false)
    withdrawn = record("withdraw", statement_digest: "")
    expect(withdrawn[:current_event]).to include(statement_text: original[:statement_text], statement_digest: original[:statement_digest])
    expect(record("grant")[:status]).to eq("granted")
  end

  it "keeps recorded_event current consistent with a withdrawal committed before its response summary" do
    digest = service.summary.dig(:statement, :digest)
    intervened = false
    allow(service).to receive(:summary).and_wrap_original do |original, *arguments|
      unless intervened
        intervened = true
        head = ConsultantInvoiceAuthorization.heads.sole
        Payroll::InvoiceAuthorization.new(employment, actor: worker).record!(action: "withdraw", expected_event_id: head.id.to_s,
          statement_digest: "", idempotency_key: "intervening-withdrawal")
      end
      original.call(*arguments)
    end
    result = service.record!(action: "grant", expected_event_id: "", statement_digest: digest, idempotency_key: "interleaved-grant")
    expect(result[:status]).to eq("withdrawn")
    expect(result[:recorded_event]).to include(action: "grant", current: false)
  end

  it "paginates immutable receipts without duplication and rejects malformed or foreign cursors" do
    23.times { |index| record(index.even? ? "grant" : "withdraw") }
    first = service.summary
    expect(first[:history].size).to eq(20)
    second = service.summary(before_id: first[:next_before_id])
    expect(second[:history].size).to eq(3)
    expect(second[:next_before_id]).to be_nil
    expect((first[:history] + second[:history]).pluck(:id).uniq.size).to eq(23)
    %w[0 01 1bad 9223372036854775808].each do |cursor|
      expect { service.summary(before_id: cursor) }.to raise_error(Payroll::ConsultantReview::InvalidInput)
    end
    expect { service.summary(before_id: "9223372036854775807") }.to raise_error(ActiveRecord::RecordNotFound)
  end

  it "rejects stale wording, stale predecessors, malformed fields and new withdrawals without a grant" do
    initial = service.summary
    input = { action: "grant", expected_event_id: "", statement_digest: initial.dig(:statement, :digest), idempotency_key: "input" }
    expect { service.record!(**input.merge(statement_digest: "a" * 64)) }.to raise_error(Payroll::Workflow::Conflict)
    expect { service.record!(**input.merge(action: "withdraw")) }.to raise_error(Payroll::Workflow::Conflict)
    [{ action: "approved" }, { expected_event_id: "01" }, { expected_event_id: 1 }, { statement_digest: [] }, { idempotency_key: "" }].each do |bad|
      expect { service.record!(**input.merge(bad)) }.to raise_error(Payroll::ConsultantReview::InvalidInput)
    end
    service.record!(**input)
    expect { service.record!(**input.merge(idempotency_key: "stale")) }.to raise_error(Payroll::Workflow::Conflict)
  end

  it "revalidates current workspace and kept subject before replay and denies consent inheritance after reassignment" do
    original = record("grant")
    worker.update!(current_workspace: create(:company))
    expect { service.summary }.to raise_error(Payroll::Workflow::NotAuthorized)
    worker.update!(current_workspace: company)
    replacement = create(:user, current_workspace: company)
    employment.update!(user: replacement)
    expect(Payroll::InvoiceAuthorization.new(employment).authorized?).to be(false)
    expect(ConsultantInvoiceAuthorizationPolicy.new(replacement, employment).show?).to be(false)
    expect(ConsultantInvoiceAuthorization.find(original.dig(:current_event, :id)).actor_id).to eq(worker.id)
  end
end
