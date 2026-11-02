# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Tax declarations", type: :request do
  let(:company) { create(:company) }
  let(:employee) { create(:user, current_workspace: company) }
  let(:admin) { create(:user, current_workspace: company) }
  let!(:employment) { create(:employment, company:, user: employee, resigned_at: nil) }
  let!(:admin_employment) { create(:employment, company:, user: admin, resigned_at: nil) }

  before do
    employee.add_role(:employee, company)
    admin.add_role(:admin, company)
    sign_in employee
  end

  def upload
    Rack::Test::UploadedFile.new(Rails.root.join("spec/support/fixtures/pdf-file.pdf"), "application/pdf")
  end

  def create_claim(**attributes)
    post "/api/v1/tax_declarations", params: { tax_declaration: {
      company_id: company.id, tax_year: "2026", category: "investment", claimed_amount: "12000.50", notes: "Investment statement",
      evidence: [upload]
    }.merge(attributes) }
  end

  def claim
    create_claim
    expect(response).to have_http_status(201)
    expect(request.filtered_parameters["tax_declaration"]).to eq("[FILTERED]")
    TaxDeclaration.order(:id).last
  end

  def submit(record)
    post "/api/v1/tax_declarations/#{record.id}/submit"
    expect(response).to have_http_status(200)
  end

  def review(record, decision: "approved", amount: "10000.25", reason: "Reviewed against evidence")
    sign_in admin
    post "/api/v1/tax_declarations/#{record.id}/review", params: {
      review: { decision:, approved_amount: amount, reason: }
    }
  end

  [:resigned, :future_joining, :missing_joining].each do |membership_state|
    it "denies #{membership_state} reviewers access to coworkers' tax evidence" do
      record = claim
      submit(record)
      attributes = case membership_state
                   when :resigned then { resigned_at: Date.yesterday }
                   when :future_joining then { joined_at: Date.tomorrow }
                   when :missing_joining then { joined_at: nil }
      end
      admin_employment.update_columns(attributes)
      sign_in admin
      get "/api/v1/tax_declarations"
      expect(response).to have_http_status(:forbidden)
      get "/api/v1/tax_declarations/#{record.id}"
      expect(response).to have_http_status(:forbidden)
      get "/api/v1/tax_declarations/#{record.id}/evidence/#{record.evidence.first.id}"
      expect(response).to have_http_status(:forbidden)
      review(record)
      expect(response).to have_http_status(:forbidden)
      create_claim
      expect(response).to have_http_status(:forbidden)
      expect(record.reload.status).to eq("submitted")
    end
  end

  it "creates an own draft with private evidence and decimal INR amounts without trusting owner/state parameters" do
    create_claim(employment_id: admin_employment.id, status: "approved", approved_amount: "12000.50")
    expect(response).to have_http_status(201)
    record = TaxDeclaration.last
    expect(record.employment).to eq(employment)
    expect(record.status).to eq("draft")
    expect(record.approved_amount).to be_nil
    expect(record.claimed_amount).to eq(BigDecimal("12000.50"))
    expect(response.body).not_to include(record.evidence.first.blob.key, "signed_id", "active_storage")
    expect(record.audits.last.audited_changes.to_s).not_to include("Investment statement", "12000.50")
  end

  it "rejects malformed declaration objects without creating a claim or attachment" do
    ["unexpected", [{ company_id: company.id }]].each do |payload|
      sign_in employee
      expect do
        post "/api/v1/tax_declarations", params: { tax_declaration: payload }, as: :json
      end.not_to change { [TaxDeclaration.count, ActiveStorage::Attachment.count] }
      expect(response).to have_http_status(:bad_request)
    end
  end

  it "rejects malformed review objects without changing the submitted claim or its audit" do
    record = claim
    submit(record)
    ["unexpected", [{ decision: "approved", approved_amount: "12000.50" }]].each do |payload|
      sign_in admin
      expect do
        post "/api/v1/tax_declarations/#{record.id}/review", params: { review: payload }, as: :json
      end.not_to change { [record.reload.attributes, record.audits.count] }
      expect(response).to have_http_status(:bad_request)
    end
  end

  it "submits, reviews and downloads the owner's proof through an authenticated no-store response" do
    record = claim
    submit(record)
    review(record)
    expect(response).to have_http_status(200)
    expect(request.filtered_parameters.dig("review", "reason")).to eq("[FILTERED]")
    expect(record.reload).to have_attributes(status: "approved", approved_amount: BigDecimal("10000.25"), reviewed_by: admin)
    sign_in employee
    get "/api/v1/tax_declarations/#{record.id}/evidence/#{record.evidence.first.id}"
    expect(response).to have_http_status(200)
    expect(response.body).to eq(record.evidence.first.download)
    expect(response.headers["Cache-Control"]).to include("private", "no-store")
    expect(record.audits.where(action: "download", associated: company, user: employee)).to exist
  end

  it "requires evidence to submit but permits estimates as drafts" do
    create_claim(evidence: [])
    expect(response).to have_http_status(201)
    record = TaxDeclaration.last
    post "/api/v1/tax_declarations/#{record.id}/submit"
    expect(response).to have_http_status(422)
    expect(record.reload.status).to eq("draft")
  end

  it "reports unavailable proof privately without recording a successful download or removing its history" do
    record = claim
    file = record.evidence.first
    file.blob.service.delete(file.blob.key)

    expect do
      get "/api/v1/tax_declarations/#{record.id}/evidence/#{file.id}"
    end.not_to change { record.audits.where(action: "download").count }

    expect(response).to have_http_status(:not_found)
    expect(response.parsed_body).to eq("errors" => "Document is unavailable. Please contact your workspace administrator.")
    expect(response.headers["Cache-Control"]).to include("private", "no-store")
    expect(response.headers["X-Content-Type-Options"]).to eq("nosniff")
    expect(record.reload.status).to eq("draft")
    expect(record.evidence.count).to eq(1)
  end

  it "refuses an upload intended for another workspace after a workspace switch" do
    other = create(:company)
    create(:employment, company: other, user: employee, resigned_at: nil)
    employee.add_role(:employee, other)
    employee.update!(current_workspace: other)
    create_claim
    expect(response).to have_http_status(409)
    expect(TaxDeclaration.count).to eq(0)
  end

  it "rejects invalid decimal precision, syntax, nonpositive and excessive amounts, years and categories" do
    ["1.001", "NaN", "1e3", "-1", "0", "10000000000", "1.00junk"].each do |amount|
      create_claim(claimed_amount: amount)
      expect(response).to have_http_status(422), amount
    end
    create_claim(tax_year: "2024")
    expect(response).to have_http_status(422)
    create_claim(category: "invented_automatic_tax_benefit")
    expect(response).to have_http_status(422)
    create_claim(category: "other", notes: "")
    expect(response).to have_http_status(422)
    expect(TaxDeclaration.count).to eq(0)
  end

  it "rejects arbitrary blob IDs, disguised, oversized, too many and publicly stored evidence" do
    create_claim(evidence: ["signed-blob-id"])
    expect(response).to have_http_status(422)
    file = Tempfile.new(["disguised", ".pdf"])
    file.write("<html>not evidence</html>")
    file.rewind
    create_claim(evidence: [Rack::Test::UploadedFile.new(file.path, "application/pdf")])
    expect(response).to have_http_status(422)
    file.rewind
    file.truncate(0)
    file.write("%PDF-1.4\n" + " " * 5.megabytes)
    file.rewind
    create_claim(evidence: [Rack::Test::UploadedFile.new(file.path, "application/pdf")])
    expect(response).to have_http_status(422)
    create_claim(evidence: Array.new(6) { upload })
    expect(response).to have_http_status(422)
    allow(ActiveStorage::Blob.service).to receive(:public?).and_return(true)
    create_claim
    expect(response).to have_http_status(422)
    expect(TaxDeclaration.count).to eq(0)
  ensure
    file&.close!
  end

  it "denies coworkers, clients, discarded members and cross-company reads or evidence access" do
    record = claim
    coworker = create(:user, current_workspace: company)
    membership = create(:employment, company:, user: coworker, resigned_at: nil)
    coworker.add_role(:book_keeper, company)
    sign_in coworker
    get "/api/v1/tax_declarations"
    expect(response.parsed_body.fetch("tax_declarations")).to be_empty
    get "/api/v1/tax_declarations/#{record.id}"
    expect(response).to have_http_status(403)
    get "/api/v1/tax_declarations/#{record.id}/evidence/#{record.evidence.first.id}"
    expect(response).to have_http_status(403)
    post "/api/v1/tax_declarations/#{record.id}/withdraw"
    expect(response).to have_http_status(403)
    coworker.remove_role(:book_keeper, company)
    coworker.add_role(:client, company)
    get "/api/v1/tax_declarations"
    expect(response).to have_http_status(403)
    coworker.add_role(:employee, company)
    membership.discard!
    get "/api/v1/tax_declarations"
    expect(response).not_to have_http_status(200)
    other = create(:company)
    admin.update!(current_workspace: other)
    create(:employment, company: other, user: admin, resigned_at: nil)
    admin.add_role(:admin, other)
    sign_in admin
    get "/api/v1/tax_declarations/#{record.id}"
    expect(response).to have_http_status(404)
  end

  it "rejects self-review and reviewing draft, withdrawn or already reviewed records" do
    sign_in admin
    record = claim
    submit(record)
    review(record)
    expect(response).to have_http_status(403)
    sign_in employee
    record = claim
    review(record)
    expect(response).to have_http_status(422)
    sign_in employee
    submit(record)
    review(record)
    expect(response).to have_http_status(200)
    review(record, decision: "rejected")
    expect(response).to have_http_status(422)
    sign_in employee
    post "/api/v1/tax_declarations/#{record.id}/withdraw"
    expect(response).to have_http_status(200)
    review(record)
    expect(response).to have_http_status(422)
  end

  it "does not let reviewers withdraw a coworker's declaration" do
    record = claim
    submit(record)
    sign_in admin
    post "/api/v1/tax_declarations/#{record.id}/withdraw"
    expect(response).to have_http_status(403)
    expect(record.reload.status).to eq("submitted")
  end

  it "validates review decisions, amount ceiling and reason without changing the submitted claim" do
    record = claim
    submit(record)
    [{ amount: "12000.51" }, { amount: "2.001" }, { amount: "0" }, { amount: "" }, { reason: "" }, { decision: "paid" }].each do |params|
      review(record, **params)
      expect(response).to have_http_status(422)
      expect(record.reload.status).to eq("submitted")
    end
    review(record, decision: "needs_information", amount: "", reason: "Provide the payment receipt")
    expect(response).to have_http_status(200)
    expect(record.reload.approved_amount).to be_nil
  end

  it "retains immutable reviewed history while a correction is pending and replaces approval atomically" do
    original = claim
    submit(original)
    review(original)
    sign_in employee
    create_claim(supersedes_id: original.id, reuse_evidence: "true", evidence: [], claimed_amount: "13000.00")
    expect(response).to have_http_status(201)
    revision = TaxDeclaration.last
    expect(revision.evidence.first.blob_id).to eq(original.evidence.first.blob_id)
    expect(original.reload.status).to eq("approved")
    expect(original.claimed_amount).to eq(BigDecimal("12000.50"))
    create_claim(supersedes_id: original.id)
    expect(response).to have_http_status(422)
    submit(revision)
    review(revision, amount: "11000")
    expect(response).to have_http_status(200)
    expect(original.reload.status).to eq("withdrawn")
    expect(original.evidence).to be_attached
    expect(original.approved_amount).to eq(BigDecimal("10000.25"))
    expect(revision.reload.status).to eq("approved")
    expect { employment.destroy! }.to change(TaxDeclaration, :count).by(-2)
  end

  it "prevents changing year or category on a revision or revising another employee's claim" do
    original = claim
    create_claim(supersedes_id: original.id, tax_year: "2025")
    expect(response).to have_http_status(422)
    create_claim(supersedes_id: original.id, category: "housing_interest")
    expect(response).to have_http_status(422)
    sign_in admin
    create_claim(supersedes_id: original.id)
    expect(response).to have_http_status(403)
  end

  it "retains the original approval through an information request and replaces it after the next correction" do
    original = claim
    submit(original)
    review(original)
    sign_in employee
    create_claim(supersedes_id: original.id, evidence: [], reuse_evidence: "true")
    correction = TaxDeclaration.last
    submit(correction)
    review(correction, decision: "needs_information", reason: "Please clarify the payment date")
    expect(original.reload.status).to eq("approved")
    sign_in employee
    create_claim(supersedes_id: correction.id, evidence: [], reuse_evidence: "true")
    final = TaxDeclaration.last
    submit(final)
    review(final)
    expect(response).to have_http_status(200)
    expect(original.reload.status).to eq("withdrawn")
    expect(correction.reload.status).to eq("needs_information")
    expect(final.reload.status).to eq("approved")
  end

  it "paginates newest first, filters year and provides no employee directory or automatic tax calculation" do
    first = claim
    30.times { create_claim(tax_year: "2025", evidence: []) }
    get "/api/v1/tax_declarations", params: { tax_year: "2025", page: "1" }
    expect(response.parsed_body.fetch("tax_declarations").size).to eq(30)
    expect(response.parsed_body.fetch("tax_declarations").pluck("id")).to eq(TaxDeclaration.where(tax_year: 2025).order(id: :desc).pluck(:id))
    get "/api/v1/tax_declarations", params: { page: "2" }
    expect(response.parsed_body.fetch("tax_declarations").pluck("id")).to eq([first.id])
    expect(response.parsed_body.fetch("calculation_enabled")).to eq(false)
    expect(response.parsed_body).not_to have_key("employments")
    get "/api/v1/tax_declarations", params: { tax_year: "2026bad" }
    expect(response).to have_http_status(400)
    get "/api/v1/tax_declarations", params: { page: { unexpected: "1" } }
    expect(response).to have_http_status(400)
  end

  it "protects cookie-authenticated writes against CSRF" do
    controller = Api::V1::TaxDeclarationsController
    original = controller.allow_forgery_protection
    controller.allow_forgery_protection = true
    create_claim
    expect(response).to have_http_status(422)
    expect(TaxDeclaration.count).to eq(0)
  ensure
    controller.allow_forgery_protection = original
  end

  it "does not repeat workspace membership checks for each declaration in the archive" do
    membership_checks = lambda do
      checks = []
      listener = ->(*args) { checks << args.last[:sql] if args.last[:sql].include?('SELECT 1 AS one FROM "employments"') }
      ActiveSupport::Notifications.subscribed(listener, "sql.active_record") { get "/api/v1/tax_declarations" }
      expect(response).to have_http_status(:ok)
      checks.size
    end
    employment.tax_declarations.create!(tax_year: 2026, category: "investment", claimed_amount: 100)
    sign_in admin
    single_record_checks = membership_checks.call
    expect(single_record_checks).to be_positive
    5.times { employment.tax_declarations.create!(tax_year: 2026, category: "investment", claimed_amount: 100) }
    expect(membership_checks.call).to be <= single_record_checks
    expect(response.parsed_body.fetch("tax_declarations").size).to eq(6)
  end

  it "keeps archive action flags consistent with record policies for owners, reviewers and corrected records" do
    [employment, admin_employment].each do |membership|
      TaxDeclaration::STATUSES.each do |status|
        membership.tax_declarations.create!(tax_year: 2026, category: "investment", claimed_amount: 100,
          status:, approved_amount: status == "approved" ? 100 : nil)
      end
    end
    original = employment.tax_declarations.find_by!(status: "approved")
    employment.tax_declarations.create!(tax_year: 2026, category: "investment", claimed_amount: 100, supersedes: original)

    [admin, employee].each do |actor|
      sign_in actor
      get "/api/v1/tax_declarations"
      expect(response).to have_http_status(:ok)
      response.parsed_body.fetch("tax_declarations").each do |item|
        record = TaxDeclaration.find(item.fetch("id"))
        authorization = TaxDeclarationPolicy.new(actor, record)
        expect(item.slice("can_submit", "can_review", "can_revise", "can_withdraw")).to eq(
          "can_submit" => authorization.submit? && record.status == "draft" && record.corrections.empty?,
          "can_review" => authorization.review? && record.status == "submitted" && record.corrections.empty?,
          "can_revise" => authorization.revise? && record.corrections.empty?,
          "can_withdraw" => authorization.withdraw? && record.status != "withdrawn")
      end
    end
  end
end
