# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Billing identity SQL invariants" do
  include_context "approved mercury consultant payroll"
  let(:billing_identity_ready) { false }
  before { worker.update!(current_workspace: company) }

  def submission
    upload = Rack::Test::UploadedFile.new(Rails.root.join("spec/support/fixtures/pdf-file.pdf"), "application/pdf")
    file = ActionDispatch::Http::UploadedFile.new(tempfile: upload.tempfile, filename: "private.pdf", type: "application/pdf")
    facts = { "legal_name" => "Synthetic", "address_line_1" => "Private", "address_line_2" => "", "city" => "Pune", "state" => "Maharashtra",
      "postal_code" => "411001", "country" => "IN", "pan_status" => "provided", "pan_number" => "AAAPC1234D", "pan_reason" => "",
      "gst_status" => "not_registered", "gst_number" => "", "gst_scheme" => "", "gst_reason" => "Declared not registered" }
    id = Payroll::BillingIdentity.new(employment, actor: worker).submit!(facts:, expected_submission_id: "", idempotency_key: "sql", pan_evidence: file).dig(:current_submission, :id)
    ConsultantBillingSubmission.find(id)
  end

  def raw_insert(model, attributes)
    ApplicationRecord.transaction(requires_new: true) { model.insert_all!([attributes]) }
  end

  it "rejects proxy, foreign tenant and stale submission insertions outside callbacks" do
    row = submission
    attributes = row.attributes.except("id").merge("previous_submission_id" => row.id, "idempotency_key" => "next")
    [{ "actor_id" => owner.id }, { "company_id" => create(:company).id }, { "employment_id" => create(:employment).id }].each do |changes|
      expect { raw_insert(ConsultantBillingSubmission, attributes.merge(changes)) }.to raise_error(ActiveRecord::StatementInvalid)
    end
    raw_insert(ConsultantBillingSubmission, attributes)
    expect { raw_insert(ConsultantBillingSubmission, attributes.merge("idempotency_key" => "stale")) }.to raise_error(ActiveRecord::StatementInvalid)
    expect(ConsultantBillingSubmission.count).to eq(2)
  end

  it "requires a nonself tenant reviewer and a single current review successor" do
    row = submission
    domain = Payroll::BillingIdentity.new(employment, actor: owner)
    id = domain.review!(submission_id: row.id.to_s, expected_review_id: "", decision: "approved", reason: "Reviewed", manual_tax_reviewed: true,
      missing_pan_acknowledged: false, idempotency_key: "review").dig(:current_review, :id)
    review = ConsultantBillingReview.find(id)
    attributes = review.attributes.except("id").merge("previous_review_id" => review.id, "idempotency_key" => "next", "decision" => "needs_information")
    [{ "actor_id" => worker.id }, { "actor_id" => accounts.id }, { "company_id" => create(:company).id }, { "submission_id" => row.id + 100 }].each do |changes|
      expect { raw_insert(ConsultantBillingReview, attributes.merge(changes)) }.to raise_error(ActiveRecord::StatementInvalid)
    end
    raw_insert(ConsultantBillingReview, attributes)
    expect { raw_insert(ConsultantBillingReview, attributes.merge("idempotency_key" => "stale")) }.to raise_error(ActiveRecord::StatementInvalid)
    ["UPDATE consultant_billing_reviews SET decision='rejected' WHERE id=#{review.id}", "DELETE FROM consultant_billing_reviews WHERE id=#{review.id}"].each do |sql|
      expect { ApplicationRecord.transaction(requires_new: true) { ApplicationRecord.connection.execute(sql) } }
        .to raise_error(ActiveRecord::StatementInvalid, /immutable/)
    end
  end

  it "preserves SQL history, blob references and adopted rollback evidence" do
    row = submission
    ["UPDATE consultant_billing_submissions SET pan_blob_id=NULL WHERE id=#{row.id}", "DELETE FROM consultant_billing_submissions WHERE id=#{row.id}"].each do |sql|
      expect { ApplicationRecord.transaction(requires_new: true) { ApplicationRecord.connection.execute(sql) } }
        .to raise_error(ActiveRecord::StatementInvalid, /immutable/)
    end
    require Rails.root.join("db/migrate/20261109150000_create_consultant_billing_identity")
    expect { CreateConsultantBillingIdentity.new.down }.to raise_error(ActiveRecord::IrreversibleMigration)
    expect(row.reload.pan_blob_id).to be_present
  end

  it "does not trust raw approved reviews with missing acknowledgements, forged commands or unresolved GST" do
    original = submission
    facts = original.facts.merge("pan_status" => "not_available", "pan_number" => "", "pan_reason" => "Awaiting PAN")
    service = Payroll::BillingIdentity.new(employment, actor: worker)
    result = service.submit!(facts:, expected_submission_id: original.id.to_s, idempotency_key: "missing-pan")
    profile_id = result.dig(:current_submission, :id)
    domain = Payroll::BillingIdentity.new(employment, actor: owner)
    approved = domain.review!(submission_id: profile_id, expected_review_id: "", decision: "approved", reason: "Manual review", manual_tax_reviewed: true,
      missing_pan_acknowledged: true, idempotency_key: "signed-review")
    row = ConsultantBillingReview.find(approved.dig(:current_review, :id))
    invalid = row.attributes.except("id").merge("previous_review_id" => row.id, "missing_pan_acknowledged" => false, "idempotency_key" => "raw-unacknowledged")
    seal_review!(invalid)
    raw_insert(ConsultantBillingReview, invalid)
    expect(service.binding).to be_nil
    expect(service.summary[:status]).to eq("submitted")
    invalid = invalid.merge("previous_review_id" => ConsultantBillingReview.heads.sole.id, "missing_pan_acknowledged" => true,
      "idempotency_key" => "raw-forged-command", "command_digest" => "0" * 64, "reason" => "PRIVATE UNKNOWN REVIEW")
    raw_insert(ConsultantBillingReview, invalid)
    expect(service.binding).to be_nil
    expect(service.summary.to_json).not_to include("PRIVATE UNKNOWN REVIEW")
    expect(service.summary.dig(:current_review, :reason)).to eq("Review integrity could not be verified")
    domain.review!(submission_id: profile_id, expected_review_id: ConsultantBillingReview.heads.sole.id.to_s, decision: "approved",
      reason: "Corrective manual review", manual_tax_reviewed: true, missing_pan_acknowledged: true, idempotency_key: "corrective")
    expect(service.binding).to be_present
    result = service.submit!(facts: facts.merge("gst_status" => "needs_review"), expected_submission_id: profile_id, idempotency_key: "unknown-gst")
    invalid = invalid.merge("submission_id" => result.dig(:current_submission, :id), "previous_review_id" => nil, "idempotency_key" => "raw-unknown-gst")
    seal_review!(invalid)
    raw_insert(ConsultantBillingReview, invalid)
    expect(service.binding).to be_nil
    expect(service.summary[:status]).to eq("submitted")
  end

  def seal_review!(attributes)
    command = ["review", attributes.fetch("submission_id").to_s, attributes["previous_review_id"].to_s,
      attributes.fetch("decision"), attributes.fetch("reason"), attributes.fetch("manual_tax_reviewed"), attributes.fetch("missing_pan_acknowledged")]
    attributes["command_digest"] = OpenSSL::HMAC.hexdigest("SHA256", ActiveRecord::Encryption.config.deterministic_key, JSON.generate(command))
  end

  it "does not decrypt transplanted tenant ciphertext through summary, evidence download or predecessor reuse" do
    source = submission
    other_company = create(:company)
    other_user = create(:user, current_workspace: other_company)
    other_employment = create(:employment, company: other_company, user: other_user, resigned_at: nil)
    enable_synthetic_payroll(other_company.id)
    ConsultantCompensation.create!(employment: other_employment, created_by: other_user, effective_on: Date.current.beginning_of_month, monthly_fee: 50_000,
      hours_per_day: 8, weekdays: [1, 2, 3, 4, 5], payment_source: "india", legal_entity_name: "Other entity", change_reason: "Configured")
    id = ApplicationRecord.connection.select_value(<<~SQL)
      INSERT INTO consultant_billing_submissions(company_id,employment_id,actor_id,facts,evidence_manifest,source_digest,command_digest,idempotency_key,pan_blob_id,gst_blob_id,created_at)
      SELECT #{other_company.id},#{other_employment.id},#{other_user.id},facts,evidence_manifest,source_digest,command_digest,'transplant',pan_blob_id,gst_blob_id,CURRENT_TIMESTAMP
      FROM consultant_billing_submissions WHERE id=#{source.id} RETURNING id
    SQL
    other = Payroll::BillingIdentity.new(other_employment, actor: other_user)
    expect { other.summary }.to raise_error(Payroll::Workflow::Conflict)
    expect_any_instance_of(ActiveStorage::Blob).not_to receive(:download)
    expect { other.download(submission_id: id.to_s, kind: "pan") }.to raise_error(Payroll::Workflow::Conflict)
    expect do
      other.submit!(facts: source.facts, expected_submission_id: id.to_s, idempotency_key: "reuse-transplant", reuse_pan_evidence: true)
    end.to raise_error(Payroll::Workflow::Conflict)
    expect(other.binding).to be_nil
  end
end
