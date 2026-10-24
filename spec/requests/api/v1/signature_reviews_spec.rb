# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Version-bound signature reviews", type: :request do
  let(:company) { create(:company) }
  let(:admin) { create(:user, current_workspace: company) }
  let!(:membership) { create(:employment, company:, user: admin, resigned_at: nil) }
  let(:source) { Rails.root.join("docs/qa/generic-document-signing-2462/qa-main.pdf") }

  before do
    admin.add_role(:owner, company)
    sign_in admin
    post "/api/v1/signature_requests", params: {
      signature_request: { company_id: company.id, title: "Private reviewed contract", creation_key: SecureRandom.uuid }.to_json,
      files: [Rack::Test::UploadedFile.new(source, "application/pdf")]
    }
    expect(response).to have_http_status(:created)
    @record = SignatureRequest.find(response.parsed_body.dig("signature_request", "id"))
    @record.with_lock do
      @record.revise!(actor: admin, attributes: {
        recipients: [{ id: "client", name: "Synthetic Client", email: "client@example.test", role: "signer" }],
        fields: [{ id: "client-signature", document_id: @record.current_revision.documents.first.fetch("key"),
          recipient_id: "client", type: "signature", label: "Signature", page: 1,
          x: 10, y: 70, width: 30, height: 8, required: true, read_only: false }]
      })
    end
  end

  def context(**attributes)
    @record.reload
    { company_id: company.id, lock_version: @record.lock_version,
      revision_id: @record.current_revision_id, content_digest: @record.current_revision.content_digest }.merge(attributes)
  end

  def review_path(suffix = "")
    "/api/v1/signature_requests/#{@record.id}/review#{suffix}"
  end

  def invite
    post review_path("/invitations"), params: { signature_request: context(recipient_id: "client") }, as: :json
    expect(response).to have_http_status(:created)
    @record.current_revision.review_invitations.last
  end

  def public_review(invitation, suffix = "/open", **attributes)
    post "/document-review#{suffix}", params: { signature_review: { token: invitation.access_token }.merge(attributes) }, as: :json
  end

  it "emails a scoped invitation without returning its token or raw storage references to the admin" do
    invitation = invite
    expect(invitation.recipient.fetch("email")).to eq("client@example.test")
    expect(invitation.access_token.length).to be >= 32
    expect(invitation.expires_at).to be > 6.days.from_now
    expect(@record.reload.current_revision.status).to eq("under_review")
    expect(response.body).not_to include(invitation.access_token, "blob_id", "signed_id")
    expect(ActiveJob::Base.queue_adapter.enqueued_jobs.last[:args].to_s).not_to include(invitation.access_token, "client@example.test")
    raw = invitation.class.connection.select_value("SELECT access_token FROM signature_review_invitations WHERE id = #{invitation.id}")
    expect(raw).not_to include(invitation.access_token)
  end

  it "gives a logged-out reviewer only the invited version and verified original bytes" do
    invitation = invite
    sign_out admin
    public_review(invitation)
    expect(response).to have_http_status(:ok)
    expect(response.parsed_body.dig("review", "revision", "title")).to eq("Private reviewed contract")
    expect(response.body).not_to include("blob_id", "signed_id", "created_by_id", "employment_id", "company_id", admin.email)
    expect(response.headers["Cache-Control"]).to include("no-store")
    expect(response.headers["Referrer-Policy"]).to eq("no-referrer")
    key = invitation.revision.documents.first.fetch("key")
    public_review(invitation, "/original", document_key: key)
    expect(response).to have_http_status(:ok)
    expect(response.body.b).to eq(File.binread(source))
    public_review(invitation, "/original", document_key: "someone-elses-document")
    expect(response).to have_http_status(:not_found)
  end

  it "stores escaped, encrypted version-bound comments and clears approval when changes are requested" do
    invitation = invite
    sign_out admin
    public_review(invitation, "/comments", body: "<script>private terms</script>", decision: "changes_requested")
    expect(response).to have_http_status(:ok)
    revision = invitation.revision.reload
    expect(revision).to have_attributes(status: "changes_requested", approved_by_id: nil, approved_at: nil)
    comment = revision.review_comments.last
    expect(comment.body).to eq("<script>private terms</script>")
    expect(comment.author_invitation_id).to eq(invitation.id)
    raw = comment.class.connection.select_value("SELECT body FROM signature_review_comments WHERE id = #{comment.id}")
    expect(raw).not_to include("private terms")
    sign_in admin
    post review_path("/comments"), params: { signature_request: context(body: "Admin response on this version") }, as: :json
    expect(response).to have_http_status(:created)
    expect(revision.review_comments.last.author_user_id).to eq(admin.id)
    get review_path, params: { revision_id: revision.id }
    expect(response.parsed_body.fetch("review").fetch("comments").pluck("body"))
      .to eq(["<script>private terms</script>", "Admin response on this version"])
  end

  it "expires or revokes a capability and returns the same safe unavailable response for invalid tokens" do
    invitation = invite
    sign_out admin
    invitation.update!(expires_at: 1.minute.from_now.change(usec: 0))
    travel_to(invitation.expires_at) { public_review(invitation) }
    expect(response).to have_http_status(:gone)
    unavailable = response.body
    post "/document-review/open", params: { signature_review: { token: "x" * 32 } }, as: :json
    expect(response).to have_http_status(:gone)
    expect(response.body).to eq(unavailable)
    sign_in admin
    delete review_path("/invitations/#{invitation.id}"), params: { signature_request: context }, as: :json
    expect(response).to have_http_status(:ok)
    sign_out admin
    public_review(invitation, "/comments", body: "Revoked comment")
    expect(response).to have_http_status(:gone)
    expect(invitation.revision.review_comments.count).to eq(0)
  end

  it "invalidates old links and approval when any source or configuration revision changes" do
    invitation = invite
    old = invitation.revision
    @record.with_lock { @record.revise!(actor: admin, attributes: { title: "New negotiated version" }) }
    sign_out admin
    public_review(invitation)
    expect(response).to have_http_status(:gone)
    expect(old.reload.title).to eq("Private reviewed contract")
    expect(@record.reload.current_revision).to have_attributes(status: "draft", approved_at: nil, approval_digest: nil)
  end

  it "records the exact reviewed digest and actor only after explicit admin approval" do
    invitation = invite
    sign_out admin
    public_review(invitation, "/comments", body: "Approved negotiated text", decision: "approved")
    expect(response).to have_http_status(:ok)
    expect(invitation.revision.reload.status).to eq("under_review")
    sign_in admin
    post review_path("/approval"), params: { signature_request: context(approval_source: "reviewers") }, as: :json
    expect(response).to have_http_status(:ok)
    expect(invitation.revision.reload).to have_attributes(status: "approved", approved_by_id: admin.id,
      approval_source: "reviewers", approval_digest: invitation.revision.content_digest)
    expect(invitation.revision.approved_at).to be_present
    @record.with_lock { @record.revise!(actor: admin, attributes: { title: "Edited after approval" }) }
    expect(@record.reload.current_revision).to have_attributes(status: "draft", approved_by_id: nil, approval_digest: nil)
  end

  it "rejects pending or changes-requested reviews and requires evidence for manually recorded approval" do
    invitation = invite
    post review_path("/approval"), params: { signature_request: context(approval_source: "reviewers") }, as: :json
    expect(response).to have_http_status(:unprocessable_entity)
    sign_out admin
    public_review(invitation, "/comments", body: "Change compensation", decision: "changes_requested")
    sign_in admin
    post review_path("/approval"), params: { signature_request: context(approval_source: "manual", approval_note: "External approval") }, as: :json
    expect(response).to have_http_status(:unprocessable_entity)
    delete review_path("/invitations/#{invitation.id}"), params: { signature_request: context }, as: :json
    post review_path("/approval"), params: { signature_request: context(approval_source: "manual", approval_note: "") }, as: :json
    expect(response).to have_http_status(:unprocessable_entity)
    post review_path("/approval"), params: { signature_request: context(approval_source: "manual", approval_note: "Approved in recorded client meeting") }, as: :json
    expect(response).to have_http_status(:ok)
    expect(@record.reload.current_revision.approval_source).to eq("manual")
  end

  it "rejects approval of an incomplete signing configuration and stale version identities" do
    stale = context
    @record.with_lock { @record.revise!(actor: admin, attributes: { fields: [] }) }
    post review_path("/approval"), params: { signature_request: stale.merge(approval_source: "manual", approval_note: "Old consent") }, as: :json
    expect(response).to have_http_status(:conflict)
    post review_path("/approval"), params: { signature_request: context(approval_source: "manual", approval_note: "Incomplete signing package") }, as: :json
    expect(response).to have_http_status(:unprocessable_entity)
    expect(@record.reload.current_revision.status).to eq("draft")
  end

  it "does not let unrelated admins or members read reviews or create invitations" do
    invite
    user = create(:user, current_workspace: company)
    create(:employment, company:, user:, resigned_at: nil)
    sign_in user
    get review_path
    expect(response).to have_http_status(:forbidden)
    user.add_role(:owner, create(:company))
    post review_path("/invitations"), params: { signature_request: context(recipient_id: "client") }, as: :json
    expect(response).to have_http_status(:forbidden)
    expect(@record.current_revision.review_invitations.count).to eq(1)
  end

  it "does not accept a caller-selected email or another revision and filters review payloads" do
    post review_path("/invitations"), params: { signature_request: context(recipient_id: "client", email: "attacker@example.test") }, as: :json
    expect(response).to have_http_status(:bad_request)
    post review_path("/invitations"), params: { signature_request: context(recipient_id: "not-on-this-version") }, as: :json
    expect(response).to have_http_status(:unprocessable_entity)
    filter = ActiveSupport::ParameterFilter.new(Rails.application.config.filter_parameters)
    expect(filter.filter("signature_review" => { "body" => "private negotiated terms", "token" => "private-link" }).values)
      .to eq(["[FILTERED]"])
  end

  it "rejects malformed comment requests before saving a comment or changing a review decision" do
    invitation = invite
    sign_out admin
    public_review(invitation, "/comments", body: "Must not save on an error response", before_id: "bad-page")
    expect(response).to have_http_status(:bad_request)
    expect(invitation.revision.review_comments.count).to eq(0)
    public_review(invitation, "/comments", body: "x" * 4001, decision: "changes_requested")
    expect(response).to have_http_status(422)
    expect(invitation.reload.decision).to be_nil
    expect(invitation.revision.reload.status).to eq("under_review")
  end

  it "revokes the former capability when inviting the same recipient again" do
    former = invite
    current = invite
    expect(former.reload.revoked_at).to be_present
    expect(current.access_token).not_to eq(former.access_token)
    sign_out admin
    public_review(former)
    expect(response).to have_http_status(:gone)
    public_review(current)
    expect(response).to have_http_status(:ok)
  end

  it "keeps earlier comments accessible in bounded pages and prevents rewriting their history" do
    invitation = invite
    revision = invitation.revision
    31.times { |index| revision.review_comments.create!(author_invitation: invitation, body: "Negotiation #{index + 1}") }
    get review_path
    data = response.parsed_body.fetch("review")
    expect(data.fetch("comments").pluck("body")).to eq((2..31).map { |index| "Negotiation #{index}" })
    get review_path, params: { before_id: data.fetch("older_before_id") }
    expect(response.parsed_body.dig("review", "comments").pluck("body")).to eq(["Negotiation 1"])
    expect { revision.review_comments.first.update!(body: "Rewritten comment") }.to raise_error(ActiveRecord::ReadOnlyRecord)
  end

  it "requires CSRF protection on admin review writes" do
    controller = Api::V1::SignatureRequestReviewsController
    original = controller.allow_forgery_protection
    controller.allow_forgery_protection = true
    post review_path("/invitations"), params: { signature_request: context(recipient_id: "client") }, as: :json
    expect(response).to have_http_status(422)
    expect(@record.current_revision.review_invitations.count).to eq(0)
  ensure
    controller.allow_forgery_protection = original if controller
  end

  it "preserves a review decision made before its access link expired" do
    invitation = invite
    sign_out admin
    public_review(invitation, "/comments", decision: "approved")
    expect(response).to have_http_status(:ok)
    travel_to(invitation.expires_at + 1.second) do
      public_review(invitation)
      expect(response).to have_http_status(:gone)
      sign_in admin
      post review_path("/approval"), params: { signature_request: context(approval_source: "reviewers") }, as: :json
      expect(response).to have_http_status(:ok)
      expect(@record.reload.current_revision.approval_source).to eq("reviewers")
    end
  end

  it "keeps a recoverable invitation and marks an email enqueue failure honestly" do
    allow(ActiveJob::Base.queue_adapter).to receive(:enqueue).and_raise(ActiveJob::EnqueueError, "Synthetic queue unavailable")
    post review_path("/invitations"), params: { signature_request: context(recipient_id: "client") }, as: :json
    expect(response).to have_http_status(:created)
    expect(@record.current_revision.review_invitations.last.email_status).to eq("failed")
    expect(response.body).not_to include("Synthetic queue unavailable")
  end

  it "cannot rebind an existing capability to a later document version" do
    invitation = invite
    original_id = invitation.revision_id
    @record.with_lock { @record.revise!(actor: admin, attributes: { title: "Unreviewed replacement" }) }
    expect(invitation.update(revision: @record.current_revision)).to be(false)
    expect(invitation.reload.revision_id).to eq(original_id)
  end
end
