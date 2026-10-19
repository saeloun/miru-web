# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Salary slips", type: :request do
  let(:company) { create(:company) }
  let(:admin) { create(:user, current_workspace: company) }
  let(:employee) { create(:user, current_workspace: company) }
  let!(:admin_employment) { create(:employment, company:, user: admin) }
  let!(:employment) { create(:employment, company:, user: employee) }

  before do
    admin.add_role(:admin, company)
    employee.add_role(:employee, company)
    sign_in admin
  end

  def import_slip(employment_id: employment.id, file: nil)
    file ||= Rack::Test::UploadedFile.new(Rails.root.join("spec/support/fixtures/pdf-file.pdf"), "application/pdf")
    post "/api/v1/salary_slips", params: {
      salary_slip: { employment_id:, pay_month: "2026-09-01", source: "Payroll provider", file: }
    }
  end

  def imported_slip
    import_slip
    expect(response).to have_http_status(:created)
    SalarySlip.order(:id).last
  end

  it "imports a draft without returning storage URLs or blob identifiers" do
    slip = imported_slip
    expect(slip.file).to be_attached
    expect(slip.published_at).to be_nil
    expect(response.parsed_body.fetch("salary_slip")).to include("status" => "draft", "employment_id" => employment.id)
    expect(response.body).not_to include(slip.file.blob.key, "signed_id", "active_storage")
    expect(response.headers["Cache-Control"]).to include("private", "no-store")
  end

  it "hides drafts from the employee and denies draft downloads" do
    slip = imported_slip
    sign_in employee
    get "/api/v1/salary_slips"
    expect(response.parsed_body.fetch("salary_slips")).to be_empty
    expect(response.parsed_body.fetch("employments")).to be_empty
    get "/api/v1/salary_slips/#{slip.id}/download"
    expect(response).to have_http_status(:forbidden)
  end

  it "publishes and downloads an employee's own slip through private no-store responses" do
    slip = imported_slip
    post "/api/v1/salary_slips/#{slip.id}/publish"
    expect(response).to have_http_status(:ok)
    sign_in employee
    get "/api/v1/salary_slips"
    expect(response.parsed_body.fetch("salary_slips").pluck("id")).to eq([slip.id])
    expect(response.headers["Cache-Control"]).to include("private", "no-store")
    get "/api/v1/salary_slips/#{slip.id}/download"
    expect(response).to have_http_status(:ok)
    expect(response.media_type).to eq("application/pdf")
    expect(response.body).to eq(slip.file.download)
    expect(response.headers["Cache-Control"]).to include("private", "no-store")
    expect(response.headers["Content-Disposition"]).to start_with("attachment;")
    expect(slip.audits.where(action: "download", user: employee)).to exist
    expect(slip.audits.where(action: "download", associated: company)).to exist
  end

  it "withdraws the previous revision when a corrected slip is published and retains its file" do
    previous = imported_slip
    post "/api/v1/salary_slips/#{previous.id}/publish"
    corrected = imported_slip
    post "/api/v1/salary_slips/#{corrected.id}/publish"
    expect(response).to have_http_status(:ok)
    expect(previous.reload.withdrawn_at).to be_present
    expect(previous.file).to be_attached
    expect(corrected.reload.supersedes_id).to eq(previous.id)
    expect(SalarySlip.published.where(employment:, pay_month: "2026-09-01").count).to eq(1)
    sign_in employee
    get "/api/v1/salary_slips/#{previous.id}/download"
    expect(response).to have_http_status(:forbidden)
  end

  it "withdraws a published slip without deleting its original and does not republish it" do
    slip = imported_slip
    post "/api/v1/salary_slips/#{slip.id}/publish"
    post "/api/v1/salary_slips/#{slip.id}/withdraw"
    expect(response).to have_http_status(:ok)
    expect(slip.reload.file).to be_attached
    post "/api/v1/salary_slips/#{slip.id}/publish"
    expect(response).to have_http_status(:unprocessable_entity)
  end

  it "links a replacement to a previously withdrawn publication without rewriting the withdrawal" do
    previous = imported_slip
    previous.publish!(actor: admin)
    previous.withdraw!(actor: admin)
    withdrawn_at = previous.reload.withdrawn_at
    replacement = imported_slip
    replacement.publish!(actor: admin)
    expect(replacement.reload.supersedes).to eq(previous)
    expect(previous.reload.withdrawn_at).to eq(withdrawn_at)
    expect(previous.file).to be_attached
  end

  it "enforces a single current publication even when a write bypasses the publication lock" do
    previous = imported_slip
    previous.publish!(actor: admin)
    corrected = imported_slip
    expect do
      SalarySlip.transaction(requires_new: true) { corrected.update_columns(published_at: Time.current) }
    end.to raise_error(ActiveRecord::RecordNotUnique)
    expect(previous.reload.status).to eq("published")
    expect(corrected.reload.status).to eq("draft")
  end

  it "keeps publication audits in the company log and allows employment deletion after a correction" do
    previous = imported_slip
    previous.publish!(actor: admin)
    corrected = imported_slip
    corrected.publish!(actor: admin)
    expect(corrected.audits.where(action: "update", associated: company)).to exist
    expect { employment.destroy! }.to change(SalarySlip, :count).by(-2)
  end

  it "denies coworkers' files and all employee mutations" do
    slip = imported_slip
    slip.publish!(actor: admin)
    coworker = create(:user, current_workspace: company)
    create(:employment, company:, user: coworker)
    coworker.add_role(:book_keeper, company)
    sign_in coworker
    get "/api/v1/salary_slips/#{slip.id}/download"
    expect(response).to have_http_status(:forbidden)
    post "/api/v1/salary_slips/#{slip.id}/withdraw"
    expect(response).to have_http_status(:forbidden)
    import_slip
    expect(response).to have_http_status(:forbidden)
  end

  it "does not allow another company to import for or download this employment" do
    slip = imported_slip
    other_company = create(:company)
    other_admin = create(:user, current_workspace: other_company)
    create(:employment, company: other_company, user: other_admin)
    other_admin.add_role(:admin, other_company)
    sign_in other_admin
    import_slip
    expect(response).to have_http_status(:not_found)
    get "/api/v1/salary_slips/#{slip.id}/download"
    expect(response).to have_http_status(:not_found)
  end

  it "denies client-only users and discarded memberships" do
    employee.remove_role(:employee, company)
    employee.add_role(:client, company)
    sign_in employee
    get "/api/v1/salary_slips"
    expect(response).to have_http_status(:forbidden)
    employee.remove_role(:client, company)
    employee.add_role(:employee, company)
    employment.update_column(:discarded_at, Time.current)
    get "/api/v1/salary_slips"
    expect(response).not_to have_http_status(:ok)
  end

  it "rejects a non-PDF disguised by its filename and upload content type" do
    file = Tempfile.new(["not-a-slip", ".pdf"])
    file.write("<html>This is not a salary slip</html>")
    file.rewind
    import_slip(file: Rack::Test::UploadedFile.new(file.path, "application/pdf"))
    expect(response).to have_http_status(:unprocessable_entity)
    expect(SalarySlip.count).to eq(0)
  ensure
    file&.close!
  end

  it "rejects a PDF over 5 MiB" do
    file = Tempfile.new(["large-slip", ".pdf"])
    file.write("%PDF-1.4\n" + (" " * 5.megabytes))
    file.rewind
    import_slip(file: Rack::Test::UploadedFile.new(file.path, "application/pdf"))
    expect(response).to have_http_status(:unprocessable_entity)
    expect(SalarySlip.count).to eq(0)
  ensure
    file&.close!
  end

  it "rejects public attachment storage" do
    allow(ActiveStorage::Blob.service).to receive(:public?).and_return(true)
    import_slip
    expect(response).to have_http_status(422)
    expect(SalarySlip.count).to eq(0)
  end

  it "rejects blob identifiers instead of uploaded files" do
    import_slip(file: "existing-blob-identifier")
    expect(response).to have_http_status(422)
    expect(SalarySlip.count).to eq(0)
  end

  it "rejects cookie-authenticated mutations without a CSRF token" do
    controller = Api::V1::SalarySlipsController
    original = controller.allow_forgery_protection
    controller.allow_forgery_protection = true
    import_slip
    expect(response).to have_http_status(422)
    expect(SalarySlip.count).to eq(0)
  ensure
    controller.allow_forgery_protection = original
  end

  it "orders and paginates slips and rejects invalid month filters" do
    slip = imported_slip
    newer = 30.times.map do
      SalarySlip.create!(employment:, uploaded_by: admin, source: "Payroll provider",
        pay_month: "2026-10-01", file: slip.file.blob)
    end
    get "/api/v1/salary_slips"
    expect(response.parsed_body.fetch("salary_slips").pluck("id")).to eq(newer.reverse.map(&:id))
    expect(response.parsed_body.fetch("pagination")).to include("page" => 1, "pages" => 2)
    get "/api/v1/salary_slips", params: { page: 2 }
    expect(response.parsed_body.fetch("salary_slips").pluck("id")).to eq([slip.id])
    get "/api/v1/salary_slips", params: { month: "2026-09" }
    expect(response.parsed_body.fetch("salary_slips").pluck("id")).to eq([slip.id])
    expect(response.parsed_body.fetch("pagination")).to include("page" => 1, "pages" => 1)
    get "/api/v1/salary_slips", params: { month: "2026-15" }
    expect(response).to have_http_status(:bad_request)
  end

  it "rejects malformed page values before conversion without returning confidential cached metadata" do
    imported_slip
    [["2"], { unexpected: "1" }, "bad", "1.5"].each do |page|
      get "/api/v1/salary_slips", params: { page: }
      expect(response).to have_http_status(400)
      expect(response.headers["Cache-Control"]).to include("private", "no-store")
    end
  end
end
