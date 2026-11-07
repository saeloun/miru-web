# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Invitation acceptance", type: :request do
  let(:user) { create(:user) }
  let(:user1) { create(:user) }
  let(:company) { create(:company) }
  let!(:invitation) { create(:invitation, company:) }

  it "shows a private confirmation without accepting or creating an account" do
    expect { get invitations_accepts_path(token: invitation.token) }.not_to change(User, :count)
    expect(response).to have_http_status(:ok)
    expect(response.body).to include("Accept invitation", ERB::Util.html_escape(company.name))
    expect(invitation.reload.accepted_at).to be_nil
    expect(response.headers).to include("Cache-Control" => "private, no-store", "Referrer-Policy" => "no-referrer",
      "X-Robots-Tag" => "noindex, nofollow")
  end

  it "does not accept a HEAD request" do
    expect { head invitations_accepts_path(token: invitation.token) }.not_to change(User, :count)
    expect(invitation.reload.accepted_at).to be_nil
    expect(response.body).to be_empty
  end

  [nil, "", ["unexpected"], { nested: "unexpected" }, "x" * 129].each do |token|
    it "rejects a malformed invitation token #{token.class}" do
      get invitations_accepts_path, params: { token: }
      expect(response).to have_http_status(:gone)
      expect(response.body).not_to include("type=\"submit\"")
      post invitations_accepts_path, params: { token: }
      expect(response).to have_http_status(:unprocessable_content)
      expect(invitation.reload.accepted_at).to be_nil
    end
  end

  it "supports invitation_token links issued by existing clients" do
    get invitations_accepts_path, params: { invitation_token: invitation.token }
    expect(response).to have_http_status(:ok)
    expect(response.body).to include("Accept invitation")
    expect(invitation.reload.accepted_at).to be_nil
    post invitations_accepts_path, params: { invitation_token: invitation.token }
    expect(response).to redirect_to(/users\/password\/edit/)
    expect(invitation.reload.accepted_at).to be_present
  end

  it "rejects a POST without CSRF protection before any membership writes" do
    with_forgery_protection do
      expect { post invitations_accepts_path, params: { token: invitation.token } }.not_to change(User, :count)
    end
    expect(response).to have_http_status(:unprocessable_content)
    expect(invitation.reload.accepted_at).to be_nil
  end

  it "sends an existing signed-out recipient to sign in after confirmation" do
    invitation.update_columns(recipient_email: user.email)
    original_password = user.encrypted_password
    post invitations_accepts_path, params: { token: invitation.token }
    expect(response).to redirect_to(new_user_session_path)
    expect(user.reload.encrypted_password).to eq(original_password)
    expect(user.valid_password?("Password123!")).to be(true)
    expect(user.current_workspace_id).to eq(company.id)
    expect(invitation.reload.accepted_at).to be_present
  end

  it "keeps an existing recipient's current workspace when merely opening the link" do
    invitation.update_columns(recipient_email: user.email)
    workspace_id = user.current_workspace_id
    get invitations_accepts_path(token: invitation.token)
    expect(response).to have_http_status(:ok)
    expect(user.reload.current_workspace_id).to eq(workspace_id)
    expect(company.employments.where(user:)).not_to exist
  end

  it "does not show a confirmation to a different signed-in account" do
    sign_in user1
    get invitations_accepts_path(token: invitation.token)
    expect(response).to have_http_status(:forbidden)
    expect(response.body).not_to include("type=\"submit\"", invitation.token)
    expect(invitation.reload.accepted_at).to be_nil
  end

  %w[missing expired accepted].each do |state|
    it "does not offer acceptance for a #{state} link" do
      invitation.update!(expired_at: 1.minute.ago) if state == "expired"
      invitation.update!(accepted_at: Time.current) if state == "accepted"
      get invitations_accepts_path(token: state == "missing" ? "unknown" : invitation.token)
      expect(response).to have_http_status(:gone)
      expect(response.body).to include("Invitation unavailable")
      expect(response.body).not_to include("type=\"submit\"")
    end
  end

  context "when new user accepts invitation" do
    before do
      send_request :post, invitations_accepts_url, params: { token: invitation.token }
    end

    it "returns redirect status" do
      expect(response).to have_http_status(:redirect)
    end

    it "redirects to edit password page" do
      expect(response.location).to include(edit_user_password_path)
    end

    it "return success flash message" do
      expect(flash[:success]).to eq("Invitation accepted")
    end

    it "creates user record" do
      expect(User.exists?(email: invitation.recipient_email)).to be(true)
    end
  end

  context "when existing user accepts invitation" do
    before do
      invitation.update_columns(recipient_email: user.email)
      sign_in user
      send_request :post, invitations_accepts_url, params: { token: invitation.token }
    end

    it "returns redirect status" do
      expect(response).to have_http_status(:redirect)
    end

    it "redirects to sign in page" do
      expect(response.location).to include(root_path)
    end

    it "return success flash message" do
      expect(flash[:success]).to eq("Invitation accepted")
    end
  end

  context "when existing user tries to accepts different user invitation" do
    before do
      invitation.update_columns(recipient_email: user.email)
      sign_in user1
      send_request :post, invitations_accepts_url, params: { token: invitation.token }
    end

    it "returns redirect status" do
      expect(response).to have_http_status(:unprocessable_content)
    end

    it "shows the account mismatch without accepting the invitation" do
      expect(response.body).to include("Sign out")
      expect(invitation.reload.accepted_at).to be_nil
    end

    it "return success flash message" do
      expect(response.body).to include("You are already signed in.")
    end
  end
end
