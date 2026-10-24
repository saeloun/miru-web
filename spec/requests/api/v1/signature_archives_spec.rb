# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Authorized signed document archives", type: :request do
  include SignatureRequestFixtures

  let(:company) { create(:company) }
  let(:admin) { create(:user, current_workspace: company) }
  let!(:membership) { create(:employment, company:, user: admin, resigned_at: nil) }
  let(:employee) { create(:user, current_workspace: company) }
  let(:employment) { create(:employment, company:, user: employee, resigned_at: nil) }
  let(:client_record) { create(:client, company:) }
  let(:client_user) { create(:user, current_workspace: company) }
  let(:provider) { instance_double(Signatures::DocumensoClient, origin: "https://signing.example.test") }
  let(:pdf) { File.binread(Rails.root.join("spec/fixtures/files/signature-sealed-synthetic.pdf")) }

  around do |example|
    travel_to(Time.utc(2026, 10, 25)) { example.run }
  end

  before do
    admin.add_role(:owner, company)
    allow(ENV).to receive(:[]).and_call_original
    allow(ENV).to receive(:[]).with("DOCUMENSO_ORIGIN").and_return("https://signing.example.test")
    allow(ENV).to receive(:[]).with("DOCUMENSO_SEAL_SHA256").and_return("eae7b329c848bdcbf3cc96829203a3dfddf922dc36b3afc4f03a14ff65b32ad7")
    allow(Signatures::DocumensoClient).to receive(:new).and_return(provider)
    @connection = SignatureConnection.create!(company:, created_by: admin, api_key: "synthetic_key",
      provider_origin: "https://signing.example.test")
    sign_in admin
  end

  def archive(client: nil, employment: nil)
    completed_signature_request(company:, actor: admin, connection: @connection, provider:, client:, employment:)
  end

  def list(**filters)
    get "/api/v1/signature_archives", params: { company_id: company.id }.merge(filters)
  end

  def download(revision, key = revision.artifact_manifest.first.fetch("key"))
    get "/api/v1/signature_archives/#{revision.id}/files/#{key}", params: { company_id: company.id }
  end

  it "lists only completed versions and streams private verified bytes with download auditing" do
    signed = archive(employment:)
    approved_signature_request(company:, actor: admin)
    list
    expect(response).to have_http_status(:ok)
    records = response.parsed_body.fetch("archives")
    expect(records.pluck("id")).to eq([signed.id])
    expect(response.body).not_to include("blob_id", "signed_id", "/rails/active_storage", "api_key", "recipients")
    download(signed)
    expect(response).to have_http_status(:ok)
    expect(response.body.b).to eq(pdf)
    expect(response.headers["Content-Disposition"]).to include("attachment")
    expect(response.headers["Cache-Control"]).to include("private", "no-store")
    expect(response.headers["Content-Security-Policy"]).to include("sandbox")
    expect(signed.signature_request.audits.where(action: "signed_archive_download").count).to eq(1)
  end

  it "lets employees download their past signed documents while denying other profiles and management APIs" do
    own = archive(employment:)
    other = archive(client: client_record)
    employment.update_columns(resigned_at: Date.yesterday)
    employee.add_role(:employee, company)
    sign_in employee
    list
    expect(response).to have_http_status(:ok)
    expect(response.parsed_body.fetch("archives").pluck("id")).to eq([own.id])
    download(own)
    expect(response).to have_http_status(:ok)
    download(other)
    expect(response).to have_http_status(:not_found)
    get "/api/v1/signature_requests/#{own.signature_request_id}"
    expect(response).to have_http_status(:forbidden)
    employment.update_columns(discarded_at: Time.current)
    download(own)
    expect(response).to have_http_status(:unauthorized)
  end

  it "limits client users to their active client membership and excludes other clients and consultant documents" do
    own = archive(client: client_record)
    other = archive(employment:)
    member = create(:client_member, user: client_user, client: client_record, company:)
    sign_in client_user
    list(client_id: client_record.id)
    expect(response).to have_http_status(:ok)
    expect(response.parsed_body.fetch("archives").pluck("id")).to eq([own.id])
    download(own)
    expect(response).to have_http_status(:ok)
    download(other)
    expect(response).to have_http_status(:not_found)
    member.discard!
    download(own)
    expect(response).to have_http_status(:not_found)
  end

  it "rejects cross-workspace access, unknown artifacts and invalid filters" do
    own = archive(employment:)
    other = create(:user, current_workspace: create(:company))
    sign_in other
    download(own)
    expect(response).to have_http_status(:conflict)
    get "/api/v1/signature_archives/#{own.id}/files/#{own.artifact_manifest.first.fetch('key')}",
      params: { company_id: other.current_workspace_id }
    expect(response).to have_http_status(:not_found)
    sign_in admin
    download(own, "unknown")
    expect(response).to have_http_status(:not_found)
    list(client_id: "../another")
    expect(response).to have_http_status(:bad_request)
    list(client_id: client_record.id, user_id: employee.id)
    expect(response).to have_http_status(:bad_request)
    list(user_id: employee.id)
    expect(response).to have_http_status(:ok)
    expect(response.parsed_body.fetch("archives").pluck("id")).to eq([own.id])
  end

  it "does not serve an archived object whose stored bytes no longer match its immutable manifest" do
    own = archive(employment:)
    allow_any_instance_of(ActiveStorage::Blob).to receive(:download).and_yield("%PDF-corrupted")
    download(own)
    expect(response).to have_http_status(:service_unavailable)
    expect(response.body).not_to include("%PDF-corrupted")
  end
end
