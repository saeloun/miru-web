# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Private remittance document API", type: :request do
  self.use_transactional_tests = false
  include_context "committed consultant invoice"
  let(:leg) { credited_invoice_leg.reload }
  let(:path) { "/api/v1/remittance_documents" }
  before do
    worker.update!(current_workspace: company)
    worker.add_role(:employee, company)
    sign_in worker
  end

  def upload_document(kind: "firc")
    post path, params: { company_id: company.id.to_s, payment_instruction_id: leg.id.to_s,
      remittance_document: { kind:, reason: "Synthetic bank-issued evidence", expected_document_id: "", idempotency_key: "http-bank-document",
        file: Rack::Test::UploadedFile.new(Rails.root.join("spec/support/fixtures/pdf-file.pdf"), "application/pdf") } }
  end

  def download_document(record)
    get "#{path}/#{record.id}/download", params: { company_id: company.id.to_s, payment_instruction_id: leg.id.to_s }
  end

  it "lets the consultant and fresh accounts/admin read exact private evidence without payment amounts" do
    upload_document
    expect(response).to have_http_status(:created)
    record = PayrollRemittanceDocument.sole
    admin = create(:user, current_workspace: company)
    create(:employment, company:, user: admin, joined_at: "2020-01-01", resigned_at: nil)
    admin.add_role(:admin, company)
    [worker, accounts, owner, admin].each do |actor|
      sign_in actor
      get path, params: { company_id: company.id.to_s, payment_instruction_id: leg.id.to_s }
      expect(response).to have_http_status(:ok)
      expect(response.parsed_body.fetch("payments").sole).to include("status" => "received", "follow_up_required" => false)
      expect(response.headers["Cache-Control"]).to include("private", "no-store")
      expect(response.body).not_to include(bank_details.fetch("bank_account_number"), "6250000", "%PDF")
      download_document(record)
      expect(response).to have_http_status(:ok)
      expect(response.body.b).to eq(File.binread(Rails.root.join("spec/support/fixtures/pdf-file.pdf")))
    end
  end

  it "denies unrelated users, other tenants, revoked roles and anonymous downloads" do
    upload_document
    record = PayrollRemittanceDocument.sole
    other = create(:user, current_workspace: company)
    create(:employment, company:, user: other)
    other.add_role(:employee, company)
    [other, accounts].each do |actor|
      accounts.remove_role(:book_keeper, company) if actor == accounts
      sign_in actor
      download_document(record)
      expect(response).to have_http_status(:forbidden)
    end
    worker.update!(current_workspace: create(:company))
    sign_in worker
    download_document(record)
    expect(response).to have_http_status(:conflict)
    sign_out worker
    download_document(record)
    expect(response).not_to have_http_status(:ok)
    expect(response.body).not_to start_with("%PDF")
  end

  it "clamps the largest valid page to this consultant's available results without overflowing SQL OFFSET" do
    upload_document
    expect(response).to have_http_status(:created)
    get path, params: { company_id: company.id.to_s, page: "9223372036854775807" }
    expect(response).to have_http_status(:ok)
    data = response.parsed_body
    expect(data).to include("page" => 1, "has_more" => false)
    expect(data.fetch("payments").sole.fetch("id")).to eq(leg.id.to_s)
  end

  it "denies every anonymous ActiveStorage bearer route while retaining authenticated history after exit" do
    upload_document
    record = PayrollRemittanceDocument.sole
    blob = record.blob
    disk = ActiveStorage::Current.set(url_options: { host: "www.example.com", protocol: "http" }) { URI(blob.url).request_uri }
    sign_out worker
    ["/rails/active_storage/blobs/redirect/#{blob.signed_id}/advice.pdf", "/rails/active_storage/blobs/proxy/#{blob.signed_id}/advice.pdf", disk].each do |url|
      get url
      expect(response).to have_http_status(:not_found)
      expect(response.body).not_to start_with("%PDF")
    end
    employment.update!(resigned_at: Date.new(2026, 12, 1))
    allow(Payroll::Entitlement).to receive(:enabled?).with(company.id).and_return(false)
    sign_in worker
    download_document(record)
    expect(response).to have_http_status(:ok)
    upload_document(kind: "fira")
    expect(response).to have_http_status(:forbidden)
  end

  it "requires an explicit matching workspace and real CSRF protection without logging file content" do
    leg
    get path
    expect(response).to have_http_status(:conflict)
    sign_in accounts
    controller = Api::V1::RemittanceDocumentsController
    original = controller.allow_forgery_protection
    controller.allow_forgery_protection = true
    upload_document
    expect(response).to have_http_status(422)
    expect(PayrollRemittanceDocument.count).to eq(0)
    filter = ActiveSupport::ParameterFilter.new(Rails.application.config.filter_parameters)
    expect(filter.filter("remittance_document" => { "reason" => "Synthetic private reference", "file" => "%PDF private" }))
      .to eq("remittance_document" => "[FILTERED]")
  ensure
    controller.allow_forgery_protection = original if controller
  end
end
