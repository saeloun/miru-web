# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Signature completion and private archives" do
  include SignatureRequestFixtures

  let(:company) { create(:company) }
  let(:admin) { create(:user, current_workspace: company) }
  let!(:membership) { create(:employment, company:, user: admin, resigned_at: nil) }
  let(:origin) { "https://signing.example.test" }
  let(:client) { instance_double(Signatures::DocumensoClient, origin:) }
  let(:signed_pdf) { File.binread(Rails.root.join("spec/fixtures/files/signature-sealed-synthetic.pdf")) }
  let(:evidence_pdf) { File.binread(Rails.root.join("docs/qa/generic-document-signing-2462/qa-addendum.pdf")) }

  around do |example|
    travel_to(Time.utc(2026, 10, 25)) { example.run }
  end

  before do
    admin.add_role(:owner, company)
    allow(ENV).to receive(:[]).and_call_original
    allow(ENV).to receive(:[]).with("DOCUMENSO_ORIGIN").and_return(origin)
    allow(ENV).to receive(:[]).with("DOCUMENSO_SEAL_SHA256").and_return("eae7b329c848bdcbf3cc96829203a3dfddf922dc36b3afc4f03a14ff65b32ad7")
    allow(Signatures::DocumensoClient).to receive(:new).and_return(client)
    connection = SignatureConnection.create!(company:, created_by: admin, provider_origin: origin, api_key: "synthetic_key")
    @record = approved_signature_request(company:, actor: admin)
    @revision = @record.current_revision
    @revision.update!(signature_connection: connection, provider_envelope_id: "envelope_completion",
      operation_id: SecureRandom.uuid, status: "awaiting_signatures", provider_status: "PENDING")
  end

  def stub_provider(status: "COMPLETED")
    data = provider_signature_record(@revision, status:)
    allow(client).to receive(:get).with(@revision.provider_envelope_id).and_return(data)
    allow(client).to receive(:original).with("item_0").and_return(@revision.original_bytes(@revision.documents.first.fetch("key")).first)
    allow(client).to receive(:signed).with("item_0").and_return(signed_pdf)
    allow(client).to receive(:certificate).with(@revision.provider_envelope_id).and_return(evidence_pdf)
    allow(client).to receive(:audit_log).with(@revision.provider_envelope_id).and_return(evidence_pdf)
    data
  end

  def reconcile = Signatures::Reconcile.new(@revision).process

  it "archives verified PDFs and both evidence files once before reporting signed" do
    stub_provider
    2.times { expect(reconcile).to be(true) }
    expect(@revision.reload).to have_attributes(status: "signed", provider_status: "COMPLETED", archive_error: nil)
    expect(@revision.archived_at).to be_present
    expect(@revision.artifact_manifest.pluck("kind")).to contain_exactly("signed", "certificate", "audit_log")
    expect(@revision.signed_artifacts.blobs.count).to eq(3)
    expect(@revision.signed_artifacts.blobs).to all(satisfy { |blob| !blob.service.public? })
    expect(client).to have_received(:signed).once
    entry = @revision.artifact_manifest.find { |item| item["kind"] == "signed" }
    expect(@revision.artifact_bytes(entry.fetch("key")).first).to eq(signed_pdf)
    expect(@revision.delivery_summary.fetch(:archive).to_json).not_to include("blob_id", "signed_id", "/rails/active_storage")
    expect(@record.audits.where(action: "signed_archive_created").count).to eq(1)
  end

  it "never downloads or publishes the unsigned fallback while the provider is pending" do
    stub_provider(status: "PENDING")
    expect(reconcile).to be(true)
    expect(client).not_to have_received(:signed)
    expect(@revision.reload.archived_at).to be_nil
    expect(@revision.status).to eq("awaiting_signatures")
    expect { @revision.artifact_bytes("missing") }.to raise_error(ActiveRecord::RecordNotFound)
  end

  it "requires every actionable recipient and required field to be completed" do
    data = stub_provider
    data.fetch("recipients").first["signingStatus"] = "NOT_SIGNED"
    expect(reconcile).to be(false)
    expect(@revision.reload.archived_at).to be_nil
    expect(client).not_to have_received(:signed)
    data.fetch("recipients").first["signingStatus"] = "SIGNED"
    data.fetch("fields").first["inserted"] = false
    expect(reconcile).to be(false)
    expect(client).not_to have_received(:signed)
  end

  it "checks the approved configuration and original bytes before downloading a final artifact" do
    data = stub_provider
    data.fetch("fields").first["page"] = 99
    expect(reconcile).to be(false)
    expect(@revision.reload.archive_error).to eq("provider_mismatch")
    expect(client).not_to have_received(:signed)
    data.fetch("fields").first["page"] = 1
    allow(client).to receive(:original).and_return(evidence_pdf)
    expect(reconcile).to be(false)
    expect(client).not_to have_received(:signed)
  end

  it "leaves no archive when a provider fallback has no valid seal" do
    stub_provider
    allow(client).to receive(:signed).and_return(evidence_pdf)
    expect { expect(reconcile).to be(false) }.not_to change(ActiveStorage::Blob, :count)
    expect(@revision.reload).to have_attributes(status: "awaiting_signatures", archive_error: "verification_failed", archived_at: nil)
    expect(@revision.signed_artifacts).not_to be_attached
  end

  it "removes incomplete staged blobs and permits a safe retry after an evidence download fails" do
    stub_provider
    allow(client).to receive(:certificate).and_raise(Signatures::DocumensoClient::Unavailable)
    expect { expect(reconcile).to be(false) }.not_to change(ActiveStorage::Blob, :count)
    expect(@revision.reload.archive_error).to eq("provider_unavailable")
    allow(client).to receive(:certificate).and_return(evidence_pdf)
    expect(reconcile).to be(true)
    expect(@revision.reload.signed_artifacts.blobs.count).to eq(3)
  end

  it "retains completed company evidence even if the original sender has left" do
    stub_provider
    membership.update_columns(resigned_at: Date.yesterday)
    admin.remove_role(:owner, company)
    expect(reconcile).to be(true)
    expect(@revision.reload.status).to eq("signed")
  end

  it "prevents replacing an archived manifest, files or completion status" do
    stub_provider
    expect(reconcile).to be(true)
    expect { @revision.update!(artifact_manifest: []) }.to raise_error(ActiveRecord::RecordInvalid)
    @revision.reload
    expect { @revision.update!(status: "awaiting_signatures") }.to raise_error(ActiveRecord::RecordInvalid)
    @revision.reload
    @revision.signed_artifacts = []
    expect { @revision.save! }.to raise_error(ActiveRecord::RecordInvalid)
  end

  it "processes a durable callback once and never regresses signed state on a later status check" do
    data = stub_provider
    receipt = @revision.signature_callbacks.create!(digest: "b" * 64, event: "DOCUMENT_COMPLETED")
    2.times { SignatureSyncJob.perform_now(@revision.id, receipt.id) }
    expect(receipt.reload.processed_at).to be_present
    expect(client).to have_received(:get).once
    expect(@revision.reload.status).to eq("signed")
    Signatures::Snapshot.new(@revision).apply!(data, checked_at: 1.minute.from_now)
    expect(@revision.reload.status).to eq("signed")
    expect { Signatures::Snapshot.new(@revision).apply!(provider_signature_record(@revision, status: "PENDING"), checked_at: 2.minutes.from_now) }
      .to raise_error(Signatures::Envelope::Mismatch)
    expect(@revision.reload.status).to eq("signed")
  end

  it "retries temporary archive failures without acknowledging their callback as processed" do
    stub_provider
    receipt = @revision.signature_callbacks.create!(digest: "b" * 64, event: "DOCUMENT_COMPLETED")
    allow(client).to receive(:certificate).and_raise(Signatures::DocumensoClient::Unavailable)
    expect { SignatureSyncJob.perform_now(@revision.id, receipt.id) }.to have_enqueued_job(SignatureSyncJob).with(@revision.id, receipt.id)
    expect(receipt.reload.processed_at).to be_nil
    expect(@revision.reload.archive_error).to eq("provider_unavailable")
    allow(client).to receive(:certificate).and_return(evidence_pdf)
    SignatureSyncJob.perform_now(@revision.id, receipt.id)
    expect(receipt.reload.processed_at).to be_present
    expect(@revision.reload.status).to eq("signed")
  end

  it "does not retry an invalid seal automatically or lose its visible failure" do
    stub_provider
    receipt = @revision.signature_callbacks.create!(digest: "b" * 64, event: "DOCUMENT_COMPLETED")
    allow(client).to receive(:signed).and_return(evidence_pdf)
    expect { SignatureSyncJob.perform_now(@revision.id, receipt.id) }.not_to have_enqueued_job(SignatureSyncJob)
    expect(receipt.reload.processed_at).to be_nil
    expect(@revision.reload.archive_error).to eq("verification_failed")
  end

  it "closes a waiting cancellation once the provider is complete even if its archive needs repair" do
    stub_provider
    operation = @revision.signature_operations.create!(kind: "cancel", requested_by: admin, state: "waiting")
    allow(client).to receive(:signed).and_return(evidence_pdf)
    expect(reconcile).to be(false)
    expect(operation.reload).to have_attributes(state: "failed", error_code: "request_closed")
    expect(@revision.reload.archive_error).to eq("verification_failed")
  end

  it "reconciles an interrupted send after its immutable archive has been saved" do
    stub_provider
    operation = @revision.signature_operations.create!(key: @revision.operation_id, kind: "send", requested_by: admin,
      state: "running", phase: "distributing", run_token: SecureRandom.uuid)
    expect(reconcile).to be(true)
    expect(operation.reload).to have_attributes(state: "confirmed", error_code: nil, run_token: nil)
  end

  it "ignores an older completed observation after a newer cancellation without fetching final files" do
    data = stub_provider
    allow(client).to receive(:get) do
      Signatures::Snapshot.new(@revision).apply!(provider_signature_record(@revision, status: "CANCELLED"), checked_at: 1.minute.from_now)
      data
    end
    expect(reconcile).to be(true)
    expect(client).not_to have_received(:signed)
    expect(@revision.reload).to have_attributes(status: "cancelled", archived_at: nil)
  end

  it "clears a temporary retrieval failure after a verified pending status check succeeds" do
    data = stub_provider(status: "PENDING")
    allow(client).to receive(:get).and_raise(Signatures::DocumensoClient::Unavailable)
    expect(reconcile).to be(false)
    expect(@revision.reload.archive_error).to eq("provider_unavailable")
    allow(client).to receive(:get).and_return(data)
    expect(reconcile).to be(true)
    expect(@revision.reload.archive_error).to be_nil
  end

  it "rejects unsigned state without an archive and cleans up a failed storage upload" do
    expect { @revision.update!(status: "signed") }.to raise_error(ActiveRecord::RecordInvalid)
    @revision.reload
    stub_provider
    allow_any_instance_of(ActiveStorage::Blob).to receive(:upload_without_unfurling).and_raise(ActiveStorage::IntegrityError)
    expect { expect(reconcile).to be(false) }.not_to change(ActiveStorage::Blob, :count)
    expect(@revision.reload.archive_error).to eq("storage_unavailable")
  end
end
