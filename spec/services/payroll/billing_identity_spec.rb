# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Consultant billing identity" do
  include_context "approved mercury consultant payroll"
  let(:billing_identity_ready) { false }
  let(:service) { Payroll::BillingIdentity.new(employment, actor: worker) }
  let(:facts) do
    { "legal_name" => "Synthetic Consultant", "address_line_1" => "12 Example Road", "address_line_2" => "", "city" => "Pune",
      "state" => "Maharashtra", "postal_code" => "411001", "country" => "IN", "pan_status" => "not_available", "pan_number" => "",
      "pan_reason" => "Awaiting PAN", "gst_status" => "not_registered", "gst_number" => "", "gst_scheme" => "", "gst_reason" => "Declared not registered" }
  end
  before { worker.update!(current_workspace: company) }

  def submit(values = facts, **options)
    service.submit!(facts: values, expected_submission_id: service.summary.dig(:current_submission, :id).to_s,
      idempotency_key: SecureRandom.uuid, **options)
  end

  def review(submission_id, actor: owner, **options)
    domain = Payroll::BillingIdentity.new(employment, actor:)
    domain.review!(submission_id:, expected_review_id: domain.summary.dig(:current_review, :id).to_s,
      decision: "approved", reason: "Explicit manual tax treatment reviewed", manual_tax_reviewed: true,
      missing_pan_acknowledged: true, idempotency_key: SecureRandom.uuid, **options)
  end

  def evidence(filename = "AAAPC1234D-private.pdf")
    upload = Rack::Test::UploadedFile.new(Rails.root.join("spec/support/fixtures/pdf-file.pdf"), "application/pdf")
    ActionDispatch::Http::UploadedFile.new(tempfile: upload.tempfile, filename:, type: "application/pdf")
  end

  def registered
    facts.merge("pan_status" => "provided", "pan_number" => "AAAPC1234D", "pan_reason" => "",
      "gst_status" => "registered", "gst_number" => "27AAAPC1234D1A5", "gst_scheme" => "regular", "gst_reason" => "")
  end

  it "binds a self submission to an explicit nonself manual review without changing monetary facts" do
    run
    initial = service.summary
    expect(initial).to include(status: "missing", can_submit: true)
    saved = service.submit!(facts:, expected_submission_id: "", idempotency_key: "first")
    expect(saved).to include(status: "submitted")
    expect(service.binding).to be_nil
    reviewed = Payroll::BillingIdentity.new(employment, actor: accounts).review!(submission_id: saved.dig(:current_submission, :id), expected_review_id: "",
      decision: "approved", reason: "Manual tax treatment reviewed while PAN is unavailable", manual_tax_reviewed: true,
      missing_pan_acknowledged: true, idempotency_key: "review")
    expect(reviewed[:status]).to eq("approved")
    expect(service.binding).to include("version" => "miru-consultant-billing-v1", "submission_id" => saved.dig(:current_submission, :id))
    expect(service.valid_binding?(service.binding)).to be(true)
    expect(PayrollPaymentInstruction.count).to eq(0)
    expect(Invoice.count).to eq(0)
  end

  it "requires explicit scalar applicability and validates syntax without claiming government eligibility" do
    invalid = [{ "postal_code" => 411001 }, { "postal_code" => "12345" }, { "country" => "US" }, { "legal_name" => "" },
      { "pan_status" => "missing" }, { "pan_reason" => "" }, { "gst_status" => "" }, { "gst_reason" => "" }, { "actor_id" => owner.id.to_s }]
    invalid.each { |changes| expect { submit(facts.merge(changes)) }.to raise_error(Payroll::ConsultantReview::InvalidInput) }
    expect { submit(registered.merge("gst_number" => "27BBBBB1234C1A5"), pan_evidence: evidence, gst_evidence: evidence) }
      .to raise_error(Payroll::ConsultantReview::InvalidInput)
    expect(ConsultantBillingSubmission.count).to eq(0)
    saved = submit(registered.merge("pan_number" => "aaapc1234d"), pan_evidence: evidence, gst_evidence: evidence)
    expect(saved.dig(:current_submission, :facts, "gst_number")).to eq("27AAAPC1234D1A5")
    expect(saved.dig(:current_submission, :masked_facts, "pan_number")).to eq("******234D")
  end

  it "preserves original submission and review retries after replacement without reinstating approval" do
    input = { facts:, expected_submission_id: "", idempotency_key: "original" }
    first = service.submit!(**input)
    id = first.dig(:current_submission, :id)
    review_input = { submission_id: id, expected_review_id: "", decision: "approved", reason: "Manual review", manual_tax_reviewed: true,
      missing_pan_acknowledged: true, idempotency_key: "original-review" }
    reviewer = Payroll::BillingIdentity.new(employment, actor: owner)
    reviewer.review!(**review_input)
    original_binding = service.binding
    submit(facts.merge("legal_name" => "Corrected Legal Name"))
    expect(service.valid_binding?(original_binding)).to be(false)
    replay = service.submit!(**input)
    expect(replay).to include(status: "submitted")
    expect(replay[:recorded_submission]).to include(id:, current: false)
    replay = reviewer.review!(**review_input)
    expect(replay[:recorded_review][:current]).to be(false)
    expect(replay[:status]).to eq("submitted")
    expect(ConsultantBillingSubmission.count).to eq(2)
    expect(ConsultantBillingReview.count).to eq(1)
    expect { service.submit!(**input.merge(facts: facts.merge("city" => "Mumbai"))) }.to raise_error(Payroll::Workflow::Conflict)
  end

  it "blocks unresolved GST and missing acknowledgements, and permits explicit approval revocation while disabled" do
    saved = submit(facts.merge("gst_status" => "needs_review"))
    expect { review(saved.dig(:current_submission, :id)) }.to raise_error(Payroll::ConsultantReview::InvalidInput)
    saved = submit
    id = saved.dig(:current_submission, :id)
    expect { review(id, missing_pan_acknowledged: false) }.to raise_error(Payroll::ConsultantReview::InvalidInput)
    expect { review(id, manual_tax_reviewed: false) }.to raise_error(Payroll::ConsultantReview::InvalidInput)
    review(id)
    allow(ENV).to receive(:[]).with("MIRU_PAYROLL_ENABLED").and_return("false")
    reviewer = Payroll::BillingIdentity.new(employment, actor: owner)
    expect(reviewer.summary).to include(can_review: true, can_approve: false)
    expect(service.binding).to be_nil
    expect { submit }.to raise_error(Payroll::Workflow::NotAuthorized)
    revoked = review(id, decision: "needs_information")
    expect(revoked).to include(status: "needs_information", can_review: false, can_approve: false)
    expect { review(id) }.to raise_error(Payroll::Workflow::NotAuthorized)
    expect(service.summary[:history].size).to eq(2)
  end

  it "does not grant proxy power or access to foreign, unassigned, exited or reassigned actors" do
    expect { Payroll::BillingIdentity.new(employment, actor: owner).submit!(facts:, expected_submission_id: "", idempotency_key: "proxy") }
      .to raise_error(Payroll::Workflow::NotAuthorized)
    id = submit.dig(:current_submission, :id)
    expect { review(id, actor: worker) }.to raise_error(Payroll::Workflow::NotAuthorized)
    expect { review(id, actor: accounts) }.to raise_error(Payroll::Workflow::NotAuthorized)
    run
    expect(Payroll::BillingIdentity.new(employment, actor: accounts).summary[:can_review]).to be(true)
    owner.employments.find_by!(company:).update!(resigned_at: company.resolved_time_zone.today.yesterday)
    expect { review(id) }.to raise_error(Payroll::Workflow::NotAuthorized)
    worker.update!(current_workspace: create(:company))
    expect { service.summary }.to raise_error(Payroll::Workflow::NotAuthorized)
    worker.update!(current_workspace: company)
    employment.update!(user: create(:user, current_workspace: company))
    expect(Payroll::BillingIdentity.new(employment).binding).to be_nil
    expect { Payroll::BillingIdentity.new(employment, actor: employment.user).summary }.to raise_error(Payroll::Workflow::NotAuthorized)
  end

  it "permits configured self corrections before joining and after exit without permitting a future reviewer" do
    employment.update!(resigned_at: company.resolved_time_zone.today.yesterday)
    expect(submit[:status]).to eq("submitted")
    future = create(:user, current_workspace: company)
    membership = create(:employment, company:, user: future, joined_at: Date.current + 2, resigned_at: nil)
    future.add_role(:owner, company)
    expect { review(service.summary.dig(:current_submission, :id), actor: future) }.to raise_error(Payroll::Workflow::NotAuthorized)
    ConsultantCompensation.create!(employment: membership, created_by: owner, effective_on: Date.current + 2, monthly_fee: 50_000,
      hours_per_day: 8, weekdays: [1, 2, 3, 4, 5], payment_source: "india", legal_entity_name: "Future entity", change_reason: "Configured before joining")
    domain = Payroll::BillingIdentity.new(membership, actor: future)
    expect(domain.submit!(facts:, expected_submission_id: "", idempotency_key: "prehire")[:status]).to eq("submitted")
  end

  it "retains private evidence under neutral names, immutable blob references and scoped unchanged reuse" do
    saved = submit(registered, pan_evidence: evidence, gst_evidence: evidence)
    submission = ConsultantBillingSubmission.find(saved.dig(:current_submission, :id))
    expect(submission.pan_blob.filename.to_s).to eq("pan-evidence.pdf")
    expect(submission.gst_blob.filename.to_s).to eq("gst-evidence.pdf")
    raw = ApplicationRecord.connection.select_one("SELECT facts,evidence_manifest FROM consultant_billing_submissions WHERE id=#{submission.id}")
    expect(raw.to_json).not_to include("AAAPC1234D", "Example Road", "blob_id")
    bytes, type, filename = service.download(submission_id: submission.id.to_s, kind: "pan")
    expect(bytes).to start_with("%PDF")
    expect([type, filename]).to eq(["application/pdf", "pan-evidence.pdf"])
    expect do
      submit(registered.merge("city" => "Mumbai"), reuse_pan_evidence: true, reuse_gst_evidence: true)
    end.not_to change(ActiveStorage::Blob, :count)
    expect(ConsultantBillingSubmission.heads.sole.pan_blob_id).to eq(submission.pan_blob_id)
    expect { submit(registered.merge("gst_scheme" => "composition"), reuse_pan_evidence: true, reuse_gst_evidence: true) }
      .to raise_error(Payroll::ConsultantReview::InvalidInput)
    expect { submit(registered.merge("pan_number" => "BBBBB1234C", "gst_number" => "27BBBBB1234C1A5"), reuse_pan_evidence: true, reuse_gst_evidence: true) }
      .to raise_error(Payroll::ConsultantReview::InvalidInput)
  end

  it "rejects missing, disguised, oversized and public evidence before retaining any blob" do
    expect { submit(registered) }.to raise_error(Payroll::ConsultantReview::InvalidInput)
    malformed = Tempfile.new(["billing-invalid", ".pdf"])
    malformed.binmode
    malformed.write("This is not a PDF")
    malformed.rewind
    upload = ActionDispatch::Http::UploadedFile.new(tempfile: malformed, filename: "claimed.pdf", type: "application/pdf")
    expect { submit(registered, pan_evidence: upload, gst_evidence: evidence) }.to raise_error(Payroll::ConsultantReview::InvalidInput)
    large = Tempfile.new(["billing-large", ".pdf"])
    large.binmode
    large.write("x" * (5.megabytes + 1))
    large.rewind
    upload = ActionDispatch::Http::UploadedFile.new(tempfile: large, filename: "large.pdf", type: "application/pdf")
    expect { submit(registered, pan_evidence: upload, gst_evidence: evidence) }.to raise_error(Payroll::ConsultantReview::InvalidInput)
    allow(ActiveStorage::Blob.service).to receive(:public?).and_return(true)
    expect { submit(registered, pan_evidence: evidence, gst_evidence: evidence) }.to raise_error(Payroll::ConsultantReview::InvalidInput)
    expect(ActiveStorage::Blob.count).to eq(0)
    expect(ConsultantBillingSubmission.count).to eq(0)
  ensure
    malformed&.close!
    large&.close!
  end

  it "replays files before extra uploads and cleans owned blobs after upload failure or a competing edit" do
    input = { facts: registered, expected_submission_id: "", idempotency_key: "file-command", pan_evidence: evidence, gst_evidence: evidence }
    first = service.submit!(**input)
    expect { service.submit!(**input) }.not_to change(ActiveStorage::Blob, :count)
    expect(service.summary.dig(:current_submission, :id)).to eq(first.dig(:recorded_submission, :id))
    calls = 0
    allow_any_instance_of(Payroll::BillingEvidence).to receive(:upload!).and_wrap_original do |original|
      value = original.call
      calls += 1
      if calls == 1
        Payroll::BillingIdentity.new(employment, actor: worker).submit!(facts:, expected_submission_id: first.dig(:current_submission, :id), idempotency_key: "competing")
      end
      value
    end
    expect do
      expect { submit(registered, pan_evidence: evidence, gst_evidence: evidence) }.to raise_error(Payroll::Workflow::Conflict)
    end.not_to change(ActiveStorage::Blob, :count)
    expect(ConsultantBillingSubmission.count).to eq(2)
    uploaded_keys = []
    allow_any_instance_of(ActiveStorage::Blob).to receive(:upload_without_unfurling).and_wrap_original do |original, *arguments|
      uploaded_keys << original.receiver.key
      raise IOError, "PRIVATE provider failure AAAPC1234D" if uploaded_keys.size == 2
      original.call(*arguments)
    end
    expect do
      expect { submit(registered, pan_evidence: evidence, gst_evidence: evidence) }
        .to raise_error(Payroll::Workflow::Conflict, "Billing evidence upload is unavailable")
    end.not_to change(ActiveStorage::Blob, :count)
    expect(uploaded_keys.map { |key| ActiveStorage::Blob.service.exist?(key) }).to eq([false, false])
  end

  it "fails closed on missing or changed bytes and reauthorizes private downloads after reading" do
    id = submit(registered, pan_evidence: evidence, gst_evidence: evidence).dig(:current_submission, :id)
    submission = ConsultantBillingSubmission.find(id)
    blob = submission.pan_blob
    blob.service.upload(blob.key, StringIO.new("Changed private bytes"))
    expect { review(id) }.to raise_error(Payroll::Workflow::Conflict)
    expect { service.download(submission_id: id, kind: "pan") }.to raise_error(Payroll::Workflow::Conflict)
    allow(Payroll::BillingEvidence).to receive(:read!).and_wrap_original do |original, *arguments|
      result = original.call(*arguments)
      worker.update!(current_workspace: create(:company))
      result
    end
    expect { service.download(submission_id: id, kind: "gst") }.to raise_error(Payroll::Workflow::NotAuthorized)
    expect(ConsultantBillingReview.count).to eq(0)
  end

  it "paginates immutable submissions and review decisions without accepting foreign cursors" do
    22.times { |index| submit(facts.merge("city" => "City #{index}")) }
    first = service.summary
    expect(first[:history].size).to eq(20)
    expect(service.summary(before_id: first[:next_before_id])[:history].size).to eq(2)
    id = first.dig(:current_submission, :id)
    22.times { review(id, decision: "needs_information") }
    first = service.summary
    expect(first[:review_history].size).to eq(20)
    expect(service.summary(review_before_id: first[:next_review_before_id])[:review_history].size).to eq(2)
    expect { service.summary(before_id: "01") }.to raise_error(Payroll::ConsultantReview::InvalidInput)
    expect { service.summary(before_id: "9223372036854775807") }.to raise_error(ActiveRecord::RecordNotFound)
  end
end
