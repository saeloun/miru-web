# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Consultant billing identity API", type: :request do
  include_context "approved mercury consultant payroll"
  let(:billing_identity_ready) { false }
  let(:path) { "/api/v1/consultant_billing_identity" }
  let(:facts) do
    { "legal_name" => "Synthetic Legal Name", "address_line_1" => "1 Private Street", "address_line_2" => "", "city" => "Pune", "state" => "Maharashtra",
      "postal_code" => "411001", "country" => "IN", "pan_status" => "not_available", "pan_number" => "", "pan_reason" => "Awaiting PAN",
      "gst_status" => "not_registered", "gst_number" => "", "gst_scheme" => "", "gst_reason" => "Not registered" }
  end
  before do
    worker.update!(current_workspace: company)
    worker.add_role(:employee, company)
    sign_in worker
  end

  def identity
    { company_id: company.id, user_id: worker.id }
  end

  def create_profile(**extra)
    post path, params: identity.merge(billing_identity: facts.merge(expected_submission_id: "", idempotency_key: "profile", reuse_pan_evidence: false, reuse_gst_evidence: false).merge(extra)), as: :json
  end

  it "performs private self submission and exact-version nonself review through real routes" do
    get path, params: identity
    expect(response).to have_http_status(:ok)
    expect(response.parsed_body.dig("billing_identity", "status")).to eq("missing")
    expect(response.headers["Cache-Control"]).to include("private", "no-store")
    create_profile
    expect(response).to have_http_status(:created)
    id = response.parsed_body.dig("billing_identity", "current_submission", "id")
    input = { submission_id: id, expected_review_id: "", decision: "approved", reason: "Manual tax review", manual_tax_reviewed: true, missing_pan_acknowledged: true, idempotency_key: "review" }
    post "#{path}/reviews", params: identity.merge(billing_review: input), as: :json
    expect(response).to have_http_status(:forbidden)
    sign_in owner
    post "#{path}/reviews", params: identity.merge(billing_review: input.merge(manual_tax_reviewed: "true")), as: :json
    expect(response).to have_http_status(422)
    post "#{path}/reviews", params: identity.merge(billing_review: input), as: :json
    expect(response).to have_http_status(:created)
    expect(response.parsed_body.dig("billing_identity", "status")).to eq("approved")
    expect(ConsultantBillingReview.count).to eq(1)
    expect(Invoice.count).to eq(0)
  end

  it "rejects forged fields, foreign workspace and session commands without CSRF" do
    create_profile(actor_id: owner.id.to_s)
    expect(response).to have_http_status(422)
    get path, params: identity.merge(company_id: company.id + 1)
    expect(response).to have_http_status(:conflict)
    get path, params: identity.merge(user_id: create(:user).id)
    expect(response).to have_http_status(:not_found)
    klass = Api::V1::ConsultantBillingIdentitiesController
    original = klass.allow_forgery_protection
    klass.allow_forgery_protection = true
    create_profile
    expect(response).to have_http_status(422)
    expect(ConsultantBillingSubmission.count).to eq(0)
  ensure
    klass.allow_forgery_protection = original if klass
  end

  it "accepts private sniffed evidence with neutral filenames and scoped downloads without broader profile access" do
    supplied = facts.merge("pan_status" => "provided", "pan_number" => "AAAPC1234D", "pan_reason" => "")
    file = Rack::Test::UploadedFile.new(Rails.root.join("spec/support/fixtures/pdf-file.pdf"), "application/pdf", original_filename: "AAAPC1234D.pdf")
    post path, params: identity.merge(billing_identity: supplied.merge(expected_submission_id: "", idempotency_key: "upload", reuse_pan_evidence: "false", reuse_gst_evidence: "false", pan_evidence: file))
    expect(response).to have_http_status(:created)
    data = response.parsed_body.fetch("billing_identity")
    download = data.dig("current_submission", "evidence", 0, "download_path")
    expect(response.body).not_to include("AAAPC1234D.pdf", "blob_id")
    get download, params: identity
    expect(response).to have_http_status(:ok)
    expect(response.body).to start_with("%PDF")
    expect(response.headers["Content-Disposition"]).to include("pan-evidence.pdf")
    run
    sign_in accounts
    get download, params: identity
    expect(response).to have_http_status(:ok)
    get "/api/v1/employee_records", params: { user_id: worker.id }
    expect(response).to have_http_status(:forbidden)
    stranger = create(:user, current_workspace: company)
    create(:employment, company:, user: stranger, resigned_at: nil)
    stranger.add_role(:book_keeper, company)
    sign_in stranger
    get download, params: identity
    expect(response).to have_http_status(:forbidden)
    expect(response.body).not_to include("AAAPC1234D", "Private Street")
  end

  it "filters complete private command roots and returns constant errors for malformed uploads" do
    filtered = ActiveSupport::ParameterFilter.new(Rails.application.config.filter_parameters)
      .filter("billing_identity" => facts, "billing_review" => { "reason" => "Private treatment" })
    expect(filtered).to eq("billing_identity" => "[FILTERED]", "billing_review" => "[FILTERED]")
    create_profile(pan_evidence: "AAAPC1234D-private-file.pdf")
    expect(response).to have_http_status(422)
    expect(response.body).not_to include("AAAPC1234D", "Private Street")
    expect(ConsultantBillingSubmission.count).to eq(0)
  end

  it "withholds evidence bytes if its CLI session is revoked or workspace changes after the storage read" do
    supplied = facts.merge("pan_status" => "provided", "pan_number" => "AAAPC1234D", "pan_reason" => "")
    upload = Rack::Test::UploadedFile.new(Rails.root.join("spec/support/fixtures/pdf-file.pdf"), "application/pdf")
    evidence = ActionDispatch::Http::UploadedFile.new(tempfile: upload.tempfile, filename: "private.pdf", type: "application/pdf")
    result = Payroll::BillingIdentity.new(employment, actor: worker).submit!(facts: supplied, expected_submission_id: "", idempotency_key: "cli-file", pan_evidence: evidence)
    download = result.dig(:current_submission, :evidence, 0, :download_path)
    sign_out worker
    %w[revoked workspace].each do |change|
      session, token = CliSession.issue_for(user: worker, company:)
      allow_any_instance_of(Payroll::BillingIdentity).to receive(:download).and_wrap_original do |original, **arguments|
        original.call(**arguments).tap do
          change == "revoked" ? session.revoke! : worker.update!(current_workspace: create(:company))
        end
      end
      get download, params: identity, headers: cli_auth_headers(token)
      expect(response).to have_http_status(:forbidden)
      expect(response.body).not_to start_with("%PDF")
    end
  end
end
