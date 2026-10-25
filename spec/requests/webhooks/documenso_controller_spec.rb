# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Documenso callbacks", type: :request do
  include SignatureRequestFixtures

  let(:company) { create(:company) }
  let(:admin) { create(:user, current_workspace: company) }
  let!(:employment) { create(:employment, company:, user: admin, resigned_at: nil) }
  let(:secret) { "synthetic-webhook-secret-32-characters" }
  let(:headers) { { "HTTP_X_DOCUMENSO_SECRET" => secret } }
  let(:body) do
    { event: "DOCUMENT_COMPLETED", payload: { envelopeId: @revision.provider_envelope_id,
      externalId: @revision.operation_id, status: "COMPLETED", downloadUrl: "https://untrusted.example.test/file.pdf" },
      createdAt: "2026-10-25T00:00:00.000Z" }
  end

  before do
    admin.add_role(:owner, company)
    allow(ENV).to receive(:[]).and_call_original
    allow(ENV).to receive(:[]).with("DOCUMENSO_ORIGIN").and_return("https://signing.example.test")
    allow(ENV).to receive(:[]).with("DOCUMENSO_WEBHOOK_SECRET").and_return(secret)
    @connection = SignatureConnection.create!(company:, created_by: admin, api_key: "synthetic_key",
      provider_origin: "https://signing.example.test")
    @record = approved_signature_request(company:, actor: admin)
    @revision = @record.current_revision
    @revision.update!(signature_connection: @connection, operation_id: SecureRandom.uuid,
      provider_envelope_id: "envelope_callback", provider_status: "PENDING", status: "awaiting_signatures")
  end

  def callback(value = body, supplied_headers = headers, connection_id: @connection.id)
    post "/webhooks/documenso/#{connection_id}", params: value, headers: supplied_headers, as: :json
  end

  it "requires a nonempty configured shared secret and a constant-time credential match" do
    [nil, "", "incorrect", "x" * 4097].each do |value|
      callback(body, { "HTTP_X_DOCUMENSO_SECRET" => value }.compact)
      expect(response).to have_http_status(:unauthorized)
    end
    allow(ENV).to receive(:[]).with("DOCUMENSO_WEBHOOK_SECRET").and_return("")
    callback
    expect(response).to have_http_status(:unauthorized)
  end

  it "persists one bound metadata-only callback and queues one read-only reconciliation for a replay" do
    2.times { callback; expect(response).to have_http_status(:accepted) }
    expect(SignatureCallback.count).to eq(1)
    receipt = SignatureCallback.first
    expect(receipt.revision).to eq(@revision)
    expect(receipt.event).to eq("DOCUMENT_COMPLETED")
    expect(receipt.attributes.values.grep(String).join).not_to include("downloadUrl", "untrusted.example.test")
    jobs = ActiveJob::Base.queue_adapter.enqueued_jobs.select { |job| job[:job].name == "SignatureSyncJob" }
    expect(jobs.size).to eq(1)
    expect(jobs.first[:args]).to eq([@revision.id, receipt.id])
    expect(@revision.reload.status).to eq("awaiting_signatures")
    expect(WebMock).not_to have_requested(:any, /untrusted/)
  end

  it "ignores foreign connections, unknown envelopes and mismatched operation identities" do
    other = SignatureConnection.create!(company: create(:company), created_by: admin, api_key: "other_synthetic_key",
      provider_origin: "https://signing.example.test")
    callback(body, headers, connection_id: other.id)
    expect(response).to have_http_status(:accepted)
    callback(body.deep_merge(payload: { envelopeId: "envelope_unknown" }))
    expect(response).to have_http_status(:accepted)
    callback(body.deep_merge(payload: { externalId: SecureRandom.uuid }))
    expect(response).to have_http_status(:accepted)
    expect(SignatureCallback.count).to eq(0)
  end

  it "rejects oversized and malformed payloads without persisting callback data" do
    post "/webhooks/documenso/#{@connection.id}", params: "x" * (1.megabyte + 1),
      headers: headers.merge("CONTENT_TYPE" => "application/json")
    expect(response).to have_http_status(:content_too_large)
    post "/webhooks/documenso/#{@connection.id}", params: "{not-json", headers: headers.merge("CONTENT_TYPE" => "application/json")
    expect(response).to have_http_status(:bad_request)
    callback(body.deep_merge(payload: { envelopeId: "../elsewhere" }))
    expect(response).to have_http_status(:bad_request)
    expect(SignatureCallback.count).to eq(0)
  end

  it "reports a queue failure and permits a provider retry of the same durable receipt" do
    allow(SignatureSyncJob).to receive(:perform_later).and_raise(ActiveJob::EnqueueError, "synthetic queue failure")
    callback
    expect(response).to have_http_status(:service_unavailable)
    expect(SignatureCallback.count).to eq(1)
    allow(SignatureSyncJob).to receive(:perform_later).and_call_original
    callback
    expect(response).to have_http_status(:accepted)
    expect(SignatureCallback.count).to eq(1)
  end

  it "leaves an interrupted enqueue retryable instead of acknowledging an unqueued receipt" do
    interruption = Class.new(StandardError)
    allow(SignatureSyncJob).to receive(:perform_later).and_raise(interruption)
    expect { callback }.to raise_error(interruption)
    receipt = SignatureCallback.sole
    expect(receipt.enqueued_at).to be_nil
    allow(SignatureSyncJob).to receive(:perform_later).and_call_original
    expect { callback }.to have_enqueued_job(SignatureSyncJob).with(@revision.id, receipt.id)
    expect(response).to have_http_status(:accepted)
    expect(SignatureCallback.count).to eq(1)
    expect(receipt.reload.enqueued_at).to be_present
  end
end
