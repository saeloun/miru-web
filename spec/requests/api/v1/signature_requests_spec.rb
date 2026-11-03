# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Private uploaded signature requests", type: :request do
  let(:company) { create(:company) }
  let(:admin) { create(:user, current_workspace: company) }
  let!(:membership) { create(:employment, company:, user: admin, resigned_at: nil) }
  let(:creation_key) { SecureRandom.uuid }
  let(:source) { Rails.root.join("docs/qa/generic-document-signing-2462/qa-main.pdf") }

  before do
    admin.add_role(:owner, company)
    sign_in admin
  end

  def upload(path = source)
    Rack::Test::UploadedFile.new(path, "application/pdf")
  end

  def create_package(**attributes)
    post "/api/v1/signature_requests", params: {
      signature_request: { company_id: company.id, title: "Synthetic private contract", creation_key: }.merge(attributes).to_json,
      files: [upload]
    }
  end

  def package
    create_package
    expect(response).to have_http_status(:created)
    SignatureRequest.find(response.parsed_body.dig("signature_request", "id"))
  end

  def edit(record, **attributes)
    patch "/api/v1/signature_requests/#{record.id}", params: { signature_request: {
      company_id: company.id, lock_version: record.lock_version
    }.merge(attributes) }, as: :json
  end

  it "creates a standalone package with private original bytes and encrypted configuration" do
    record = package
    revision = record.current_revision
    expect(record).to have_attributes(client_id: nil, employment_id: nil)
    expect(revision.documents.first).to include("sha256" => Digest::SHA256.file(source).hexdigest)
    expect(revision.originals.first.download).to eq(File.binread(source))
    expect(revision.originals.first.blob.service).not_to be_public
    raw = SignatureRequestRevision.connection.select_value("SELECT documents FROM signature_request_revisions WHERE id = #{revision.id}")
    expect(raw).not_to include("qa-main.pdf", revision.documents.first.fetch("sha256"))
    expect(response.body).not_to include("signed_id", "blob_id", "/rails/active_storage")
    expect(response.headers["Cache-Control"]).to include("private", "no-store")
  end

  it "recovers a repeated create without duplicating packages or files and rejects reuse for other content" do
    record = package
    expect { create_package }.not_to change(ActiveStorage::Blob, :count)
    expect(response).to have_http_status(:ok)
    expect(response.parsed_body.dig("signature_request", "id")).to eq(record.id)
    create_package(title: "Different private contract")
    expect(response).to have_http_status(:conflict)
    expect(SignatureRequest.count).to eq(1)
  end

  it "preserves original revisions on field edits and rejects stale or noninteger versions" do
    record = package
    original = record.current_revision
    edit(record, title: "Negotiated private contract")
    expect(response).to have_http_status(:ok)
    expect(record.reload.current_revision_id).not_to eq(original.id)
    expect(record.current_revision.originals.first.blob_id).to eq(original.originals.first.blob_id)
    expect(original.reload.title).to eq("Synthetic private contract")
    expect(original.content_digest).not_to eq(record.current_revision.content_digest)
    [0, record.lock_version.to_s, nil].each do |version|
      edit(record, lock_version: version, title: "Stale private content")
      expect(response).to have_http_status(:conflict)
    end
    expect(record.reload.title).to eq("Negotiated private contract")
    expect(original.update(title: "Rewrite history")).to be(false)
  end

  it "clears fields and approvals on source replacement and retains the reviewed version" do
    record = package
    original = record.current_revision
    recipient = { id: "signer", name: "Synthetic Signer", email: "signer@example.test", role: "signer" }
    field = { id: "signature", document_id: original.documents.first.fetch("key"), recipient_id: "signer", page: 2,
      type: "signature", label: "Signature", required: true, read_only: false, x: 10, y: 70, width: 30, height: 10 }
    edit(record, recipients: [recipient], fields: [field])
    expect(response).to have_http_status(:ok)
    reviewed = record.reload.current_revision
    reviewed.update!(status: "approved", approved_by: admin, approved_at: Time.current)
    post "/api/v1/signature_requests/#{record.id}/sources", params: {
      signature_request: { company_id: company.id, lock_version: record.lock_version }.to_json,
      files: [upload(Rails.root.join("docs/qa/generic-document-signing-2462/qa-addendum.pdf"))]
    }
    expect(response).to have_http_status(:ok)
    fresh = record.reload.current_revision
    expect(fresh).to have_attributes(status: "draft", fields: [], approved_by_id: nil, approved_at: nil)
    expect(fresh.recipients).to eq([recipient.stringify_keys])
    expect(fresh.documents.first.fetch("pages").size).to eq(1)
    expect(reviewed.reload).to have_attributes(status: "approved", fields: [field.stringify_keys])
  end

  it "forks an approved configuration when edited and locks sending or sent versions" do
    record = package
    approved = record.current_revision
    approved.update!(status: "approved", approved_by: admin, approved_at: Time.current)
    edit(record, title: "New draft")
    expect(response).to have_http_status(:ok)
    expect(record.reload.current_revision).to have_attributes(status: "draft", approved_at: nil)
    expect(approved.reload.status).to eq("approved")
    %w[sending send_uncertain awaiting_signatures signed declined expired].each do |status|
      record.current_revision.update_columns(status:)
      edit(record, title: "Should remain locked")
      expect(response).to have_http_status(:conflict)
    end
    expect(record.reload.title).to eq("New draft")
  end

  it "rejects a bad replacement atomically without removing existing files" do
    record = package
    original_id = record.current_revision_id
    Tempfile.create(["invalid-private", ".pdf"]) do |file|
      file.write("private contract, not a PDF"); file.flush
      expect do
        post "/api/v1/signature_requests/#{record.id}/sources", params: {
          signature_request: { company_id: company.id, lock_version: record.lock_version }.to_json,
          files: [upload(file.path)]
        }
      end.not_to change(ActiveStorage::Blob, :count)
    end
    expect(response).to have_http_status(:unprocessable_entity)
    expect(response.body).not_to include("private contract, not a PDF")
    expect(record.reload.current_revision_id).to eq(original_id)
    expect(record.current_revision.originals.first.download).to eq(File.binread(source))
  end

  it "rolls back uploaded blobs when persistence fails" do
    uploaded = []
    allow_any_instance_of(SignatureRequestRevision).to receive(:save!) do |revision|
      uploaded.concat(revision.originals.blobs)
      raise ActiveRecord::RecordInvalid.new(revision)
    end
    expect { create_package }.not_to change(ActiveStorage::Blob, :count)
    expect(response).to have_http_status(422)
    expect(SignatureRequest.count).to eq(0)
    expect(uploaded.size).to eq(1)
    expect(uploaded.first.service.exist?(uploaded.first.key)).to be(false)
  end

  it "rejects cross-company links and stale workspaces before creating files" do
    create_package(client_id: create(:client).id)
    expect(response).to have_http_status(:not_found)
    create_package(employment_id: create(:employment).id)
    expect(response).to have_http_status(:not_found)
    create_package(company_id: create(:company).id)
    expect(response).to have_http_status(:conflict)
    expect(SignatureRequest.count).to eq(0)
  end

  it "allows optional current-company associations without requiring a template" do
    client = create(:client, company:)
    create_package(client_id: client.id)
    expect(response).to have_http_status(:created)
    expect(SignatureRequest.last.client_id).to eq(client.id)
  end

  it "serves exact historical files only through the company-scoped revision route" do
    record = package
    revision = record.current_revision
    path = "/api/v1/signature_requests/#{record.id}/revisions/#{revision.id}/originals/#{revision.documents.first.fetch('key')}"
    get path
    expect(response).to have_http_status(:ok)
    expect(response.body.b).to eq(File.binread(source))
    expect(response.headers["X-Content-Type-Options"]).to eq("nosniff")
    get path.sub("/revisions/#{revision.id}/", "/revisions/0/")
    expect(response).to have_http_status(:not_found)
    other = create(:company)
    admin.update!(current_workspace: other)
    create(:employment, company: other, user: admin, resigned_at: nil)
    admin.add_role(:owner, other)
    get path
    expect(response).to have_http_status(:not_found)
  end

  it "returns metadata-only lists and audits without loading encrypted content" do
    record = package
    queries = []
    listener = ->(*args) { queries << args.last[:sql] if args.last[:sql].include?('FROM "signature_request') }
    ActiveSupport::Notifications.subscribed(listener, "sql.active_record") { get "/api/v1/signature_requests" }
    expect(response).to have_http_status(:ok)
    expect(response.parsed_body.fetch("signature_requests").pluck("id")).to eq([record.id])
    expect(response.body).not_to include("documents", "recipients", "fields", "content_digest")
    expect(queries.join).not_to match(/"signature_request_revisions"\.\*|"documents"|"recipients"|"fields"/)
    get "/api/v1/signature_requests/#{record.id}"
    expect(response.parsed_body.dig("signature_request", "revision", "documents").size).to eq(1)
    expect(record.audits.pluck(:audited_changes).to_json).not_to include("Synthetic private contract", "example.test", "qa-main.pdf")
  end

  it "denies employees and inactive admins and rechecks permission after PDF processing" do
    record = package
    admin.remove_role(:owner, company)
    get "/api/v1/signature_requests/#{record.id}"
    expect(response).to have_http_status(:forbidden)
    admin.add_role(:owner, company)
    membership.update!(resigned_at: Date.yesterday)
    get "/api/v1/signature_requests/#{record.id}"
    expect(response).to have_http_status(:forbidden)
    membership.update!(resigned_at: nil)
    allow_any_instance_of(Signatures::PdfInfo).to receive(:process).and_wrap_original do |method|
      result = method.call
      admin.remove_role(:owner, company)
      result
    end
    create_package(creation_key: SecureRandom.uuid)
    expect(response).to have_http_status(:forbidden)
    expect(SignatureRequest.count).to eq(1)
  end

  it "filters uploads, recipient identities and field values from logs" do
    filter = ActiveSupport::ParameterFilter.new(Rails.application.config.filter_parameters)
    filtered = filter.filter("signature_request" => { "recipients" => "private-recipient", "fields" => "private-value" }, "files" => ["private-file"])
    expect(filtered.to_json).not_to include("private-")
  end

  it "rejects unsupported upload references, excessive files and page totals" do
    post "/api/v1/signature_requests", params: { signature_request: { company_id: company.id, creation_key:, title: "Bad source" }, files: ["existing-blob-reference"] }, as: :json
    expect(response).to have_http_status(422)
    File.open(source) do |file|
      source_upload = ActionDispatch::Http::UploadedFile.new(tempfile: file, filename: "synthetic.pdf")
      expect { Signatures::Upload.new(Array.new(11, source_upload)) }.to raise_error(Signatures::PdfInfo::InvalidDocument)
      allow_any_instance_of(Signatures::PdfInfo).to receive(:process).and_return({ "sha256" => "a" * 64,
        "pages" => Array.new(51) { { "width" => 100, "height" => 100, "rotation" => 0 } } })
      expect { Signatures::Upload.new([source_upload, source_upload]) }.to raise_error(Signatures::PdfInfo::InvalidDocument, /100 source pages/)
    end
    expect(SignatureRequest.count).to eq(0)
  end

  it "does not create a package when its storage service is public" do
    allow(ActiveStorage::Blob.service).to receive(:public?).and_return(true)
    create_package
    expect(response).to have_http_status(:service_unavailable)
    expect(SignatureRequest.count).to eq(0)
  end

  it "rejects malformed field configuration without changing the current revision" do
    record = package
    original = record.current_revision
    edit(record, fields: [{ id: "outside", x: 95, width: 30 }])
    expect(response).to have_http_status(422)
    expect(record.reload.current_revision_id).to eq(original.id)
    expect(record.signature_revisions.count).to eq(1)
  end

  it "rejects original bytes that no longer match the preserved source digest" do
    record = package
    revision = record.current_revision
    blob = revision.originals.first.blob
    blob.service.upload(blob.key, StringIO.new("Corrupted private source"))
    get "/api/v1/signature_requests/#{record.id}/revisions/#{revision.id}/originals/#{revision.documents.first.fetch('key')}"
    expect(response).to have_http_status(:service_unavailable)
    expect(response.body).not_to include("Corrupted private source")
  end

  it "protects cookie-authenticated uploads against CSRF" do
    controller = Api::V1::SignatureRequestsController
    original = controller.allow_forgery_protection
    controller.allow_forgery_protection = true
    create_package
    expect(response).to have_http_status(:unprocessable_content)
    expect(SignatureRequest.count).to eq(0)
  ensure
    controller.allow_forgery_protection = original if controller
  end
end
