# frozen_string_literal: true

module ConsultantBillingIdentityHelper
  def review_synthetic_billing_identity(employment:, reviewer:, gst_scheme: nil)
    actor = User.find(employment.user_id)
    original_workspace_id = actor.current_workspace_id
    actor.update_columns(current_workspace_id: employment.company_id)
    facts = { "legal_name" => "Synthetic Consultant", "address_line_1" => "1 Synthetic Road", "address_line_2" => "",
      "city" => "Pune", "state" => "Maharashtra", "postal_code" => "411001", "country" => "IN",
      "pan_status" => "provided", "pan_number" => "AAAPC1234D", "pan_reason" => "",
      "gst_status" => "not_registered", "gst_number" => "", "gst_scheme" => "", "gst_reason" => "Synthetic reviewed registration facts" }
    facts.merge!("gst_status" => "registered", "gst_number" => "27AAAPC1234D1A5", "gst_scheme" => gst_scheme) if gst_scheme
    upload = Rack::Test::UploadedFile.new(Rails.root.join("spec/support/fixtures/pdf-file.pdf"), "application/pdf")
    evidence = ActionDispatch::Http::UploadedFile.new(tempfile: upload.tempfile, filename: "synthetic-pan.pdf", type: "application/pdf")
    gst_upload = Rack::Test::UploadedFile.new(Rails.root.join("spec/support/fixtures/pdf-file.pdf"), "application/pdf") if gst_scheme
    gst_evidence = ActionDispatch::Http::UploadedFile.new(tempfile: gst_upload.tempfile, filename: "synthetic-gst.pdf", type: "application/pdf") if gst_upload
    Payroll::BillingIdentity.new(employment, actor:).submit!(facts:, expected_submission_id: "",
      idempotency_key: "synthetic-billing-#{employment.id}", pan_evidence: evidence, gst_evidence:)
    submission = ConsultantBillingSubmission.heads.find_by!(employment:)
    Payroll::BillingIdentity.new(employment, actor: reviewer).review!(submission_id: submission.id.to_s,
      expected_review_id: "", decision: "approved", reason: "Synthetic evidence and manual tax treatment reviewed",
      manual_tax_reviewed: true, missing_pan_acknowledged: false, idempotency_key: "synthetic-review-#{employment.id}")
    Payroll::BillingIdentity.new(employment).binding
  ensure
    actor&.update_columns(current_workspace_id: original_workspace_id)
    employment.association(:company).reset
    upload&.tempfile&.close!
    gst_upload&.tempfile&.close!
  end
end

RSpec.configure { |config| config.include ConsultantBillingIdentityHelper }
