# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Consultant profile completion requests" do
  include_context "approved mercury consultant payroll"

  let(:requests) { Payroll::ProfileCompletion.new(run, actor: accounts) }

  around { |example| travel_to(Time.utc(2026, 12, 5, 12)) { example.run } }

  before do
    employment.update!(joined_at: "2020-01-01")
    worker.update!(current_workspace: company)
    worker.add_role(:employee, company)
  end

  def omit_bank(field = "bank_country")
    employment.employee_record.update!(private_details: bank_details.except(field))
    employment.reload
  end

  def request_profile(key: "profile-request", digest: requests.summary(employment).fetch(:source_digest))
    requests.create!(employment_id: employment.id.to_s, expected_digest: digest, idempotency_key: key)
  end

  it "records one consultant-only request without approving or exposing private profile facts" do
    omit_bank
    summary = requests.summary(employment)
    expect(summary).to include(categories: ["bank_details"], can_request: true, request: nil)
    record = request_profile

    expect(record).to have_attributes(company_id: company.id, payroll_run_id: run.id,
      employment_id: employment.id, requested_by_id: accounts.id, recipient_id: worker.id, state: "queued")
    expect(requests.summary(employment)).to include(can_request: false, request: record.receipt)
    expect(record.receipt.to_json).not_to include(worker.email, bank_details.fetch("bank_account_number"), "PRIVATE")
    expect(run.reload.current_revision).to be_nil
  end

  it "replays the original command after profile changes but rejects a changed command under the same key" do
    omit_bank
    old_digest = requests.summary(employment).fetch(:source_digest)
    original = request_profile(digest: old_digest)
    employment.employee_record.update!(private_details: bank_details)

    expect(request_profile(digest: old_digest).id).to eq(original.id)
    expect { request_profile(digest: "a" * 64) }.to raise_error(Payroll::Workflow::Conflict)
    expect(PayrollProfileCompletionRequest.count).to eq(1)
  end

  it "refuses a stale source and duplicate delivery identities under a new command" do
    omit_bank
    old_digest = requests.summary(employment).fetch(:source_digest)
    employment.employee_record.update!(private_details: bank_details.except("bank_name"))
    expect { request_profile(digest: old_digest) }.to raise_error(Payroll::Workflow::Conflict)
    request_profile
    expect { request_profile(key: "another-command") }.to raise_error(Payroll::Workflow::Conflict)
    expect(PayrollProfileCompletionRequest.count).to eq(1)
  end

  it "does not request complete facts or invoice consent and keeps other consultants' preparation available" do
    expect(requests.summary(employment)).to include(categories: [], can_request: false, source_digest: nil)
    expect { request_profile(digest: "a" * 64) }.to raise_error(Payroll::MercuryPayment::Blocked)
    configure_synthetic_pto_policy
    record_synthetic_pto_treatment
    before = Payroll::ConsultantRevision.new(run, actor: accounts).preparation(cutoff: "2026-11-30")
    omit_bank
    request_profile
    after = Payroll::ConsultantRevision.new(run, actor: accounts).preparation(cutoff: "2026-11-30")
    expect(after.sole.except(:profile_completion)).to eq(before.sole.except(:profile_completion))
    expect(after.sole[:ready]).to be(true)
    expect(ConsultantInvoiceAuthorization.where(employment:)).to be_empty
  end

  it "requires SWIFT only for Mercury and never requires the optional bank branch" do
    omit_bank("bank_swift")
    expect(requests.summary(employment)[:categories]).to eq(["bank_details"])
    terms = employment.consultant_compensations.order(:id).last
    ConsultantCompensation.create!(terms.attributes.except("id", "created_at", "updated_at").merge(payment_source: "india"))
    expect(requests.summary(employment)[:categories]).to eq([])
    employment.employee_record.update!(private_details: bank_details.except("bank_branch", "bank_swift"))
    expect(requests.summary(employment)[:categories]).to eq([])
  end

  it "does not chase a consultant for reviewer-only pending billing facts" do
    previous = ConsultantBillingSubmission.heads.find_by!(employment:)
    billing = Payroll::BillingIdentity.new(employment, actor: worker)
    billing.submit!(facts: previous.facts, expected_submission_id: previous.id.to_s,
      idempotency_key: "new-billing-version", reuse_pan_evidence: true)
    expect(Payroll::BillingIdentity.new(employment).binding).to be_nil
    expect(requests.summary(employment)[:categories]).to eq([])

    current = ConsultantBillingSubmission.heads.find_by!(employment:)
    Payroll::BillingIdentity.new(employment, actor: accounts).review!(submission_id: current.id.to_s,
      expected_review_id: "", decision: "needs_information", reason: "Please correct the address in your billing profile",
      manual_tax_reviewed: false, missing_pan_acknowledged: false, idempotency_key: "billing-correction")
    expect(requests.summary(employment)[:categories]).to eq(["billing_identity"])
  end

  it "leaves an invalid historical funding source for accounts rather than requesting guessed bank requirements" do
    omit_bank
    terms = employment.consultant_compensations.order(:id).last
    ConsultantCompensation.insert_all!([terms.attributes.except("id").merge("payment_source" => "unconfigured")])
    expect(requests.summary(employment)).to include(categories: [], can_request: false, source_digest: nil)
  end

  it "still requests billing corrections when accounts must resolve an unknown funding source" do
    run
    terms = employment.consultant_compensations.order(:id).last
    ConsultantCompensation.insert_all!([terms.attributes.except("id").merge("payment_source" => "unconfigured")])
    previous = ConsultantBillingSubmission.heads.find_by!(employment:)
    Payroll::BillingIdentity.new(employment, actor: worker).submit!(facts: previous.facts, expected_submission_id: previous.id.to_s,
      idempotency_key: "unknown-funding-billing", reuse_pan_evidence: true)
    current = ConsultantBillingSubmission.heads.find_by!(employment:)
    Payroll::BillingIdentity.new(employment, actor: accounts).review!(submission_id: current.id.to_s,
      expected_review_id: "", decision: "needs_information", reason: "Please correct the address in your billing profile",
      manual_tax_reviewed: false, missing_pan_acknowledged: false, idempotency_key: "unknown-funding-correction")
    omit_bank

    expect(requests.summary(employment)).to include(categories: ["billing_identity"], can_request: true)
    expect(request_profile.categories).to eq(["billing_identity"])
  end

  it "permits a fresh explicit command after an unattempted failure while replaying the original failed receipt" do
    omit_bank
    original = request_profile
    original.update!(state: "failed")

    expect(requests.summary(employment)).to include(can_request: true, request: original.receipt)
    expect(request_profile.id).to eq(original.id)
    replacement = request_profile(key: "explicit-retry")
    expect(replacement).to have_attributes(state: "queued", source_digest: original.source_digest)
    expect(replacement.id).not_to eq(original.id)
  end

  it "reauthorizes the current workspace and rejects a foreign employment before recording anything" do
    omit_bank
    source = requests.summary(employment).fetch(:source_digest)
    stranger = create(:employment)
    expect do
      requests.create!(employment_id: stranger.id.to_s, expected_digest: source, idempotency_key: "foreign")
    end.to raise_error(ActiveRecord::RecordNotFound)
    accounts.update!(current_workspace: create(:company))
    expect { request_profile(digest: source) }.to raise_error(Payroll::Workflow::NotAuthorized)
    expect(PayrollProfileCompletionRequest.count).to eq(0)
  end
end
