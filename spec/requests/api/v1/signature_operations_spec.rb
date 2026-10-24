# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Private signature delivery actions", type: :request do
  include SignatureRequestFixtures

  let(:company) { create(:company) }
  let(:admin) { create(:user, current_workspace: company) }
  let!(:membership) { create(:employment, company:, user: admin, resigned_at: nil) }

  before do
    admin.add_role(:owner, company)
    sign_in admin
    allow(ENV).to receive(:[]).and_call_original
    allow(ENV).to receive(:[]).with("DOCUMENSO_ORIGIN").and_return("https://signing.example.test")
    @connection = SignatureConnection.create!(company:, created_by: admin,
      provider_origin: "https://signing.example.test", api_key: "api_synthetic_private_key")
    @record = approved_signature_request(company:, actor: admin)
  end

  def operation(kind = "send", **attributes)
    post "/api/v1/signature_requests/#{@record.id}/operations", params: {
      signature_request: signature_context(@record).merge(kind:, **attributes)
    }, as: :json
  end

  it "queues the approved version and returns private metadata without credential or worker tokens" do
    operation
    expect(response).to have_http_status(:accepted)
    result = response.parsed_body.fetch("operation")
    expect(result).to include("kind" => "send", "state" => "queued", "phase" => "preparing")
    expect(response.headers["Cache-Control"]).to include("no-store")
    expect(response.body).not_to include("api_synthetic_private_key", "api_key", "run_token", "provider_origin")
    expect(ActiveJob::Base.queue_adapter.enqueued_jobs.last[:args]).to eq([result.fetch("id")])
    expect(response.parsed_body.dig("signature_request", "revision", "delivery", "operation_id")).to eq(result.fetch("key"))
    operation
    expect(response).to have_http_status(:conflict)
    expect(SignatureOperation.where(kind: "send").count).to eq(1)
  end

  it "queues a cancellation without clearing approval or allowing edits before its result is known" do
    operation
    operation("cancel")
    expect(response).to have_http_status(:accepted)
    expect(response.parsed_body.dig("operation", "kind")).to eq("cancel")
    revision = @record.reload.current_revision
    expect(revision.cancel_requested_at).to be_present
    expect(revision.status).to eq("sending")
    expect(revision.approval_digest).to eq(revision.content_digest)
    expect { @record.with_lock { @record.revise!(actor: admin, attributes: { title: "Premature changes" }) } }
      .to raise_error(SignatureRequest::Conflict)
  end

  it "denies an employee, a resigned admin and another company's record before queuing work" do
    admin.remove_role(:owner, company)
    admin.add_role(:employee, company)
    operation
    expect(response).to have_http_status(:forbidden)
    admin.remove_role(:employee, company)
    admin.add_role(:owner, company)
    membership.update_columns(resigned_at: Date.yesterday)
    operation
    expect(response).to have_http_status(:forbidden)
    membership.update_columns(resigned_at: nil)
    other = create(:company)
    create(:employment, company: other, user: admin, resigned_at: nil)
    admin.add_role(:owner, other)
    admin.update!(current_workspace: other)
    operation
    expect(response).to have_http_status(:not_found)
    expect(SignatureOperation.count).to eq(0)
  end

  it "rejects stale versions, changed approvals and injected provider settings" do
    operation(lock_version: "1")
    expect(response).to have_http_status(:conflict)
    operation(revision_id: @record.current_revision_id + 1)
    expect(response).to have_http_status(:conflict)
    @record.current_revision.update!(approval_digest: "b" * 64)
    operation
    expect(response).to have_http_status(:conflict)
    operation(provider_origin: "https://attacker.example.test")
    expect(response).to have_http_status(:bad_request)
    operation("destroy")
    expect(response).to have_http_status(:bad_request)
    expect(SignatureOperation.count).to eq(0)
  end

  it "retains a queued request when credentials are rotated and rejects cross-workspace commands" do
    operation(company_id: create(:company).id)
    expect(response).to have_http_status(:conflict)
    operation
    revision = @record.reload.current_revision
    @connection.update!(disabled_at: Time.current)
    SignatureConnection.create!(company:, created_by: admin, provider_origin: "https://signing.example.test", api_key: "api_rotated")
    operation("refresh")
    expect(response).to have_http_status(:accepted)
    expect(revision.reload.signature_connection_id).to eq(@connection.id)
  end

  it "requires CSRF protection before accepting a cookie-authenticated action" do
    controller = Api::V1::SignatureOperationsController
    original = controller.allow_forgery_protection
    controller.allow_forgery_protection = true
    operation
    expect(response).to have_http_status(:unprocessable_content)
    expect(SignatureOperation.count).to eq(0)
  ensure
    controller.allow_forgery_protection = original if controller
  end

  it "requires reconnecting before queuing a request against a changed provider origin" do
    allow(ENV).to receive(:[]).with("DOCUMENSO_ORIGIN").and_return("https://new-signing.example.test")
    operation
    expect(response).to have_http_status(:conflict)
    expect(SignatureOperation.count).to eq(0)
  end
end
