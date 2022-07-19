# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Invitations::Accept#create", type: :request do
  let(:user) { create(:user) }
  let(:company) { create(:company) }
  let!(:invitation) { create(:invitation, company:) }

  context "when new user accepts invitation" do
    before do
      send_request :get, accepts_url(token: invitation.token)
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

    it "creates invitation record" do
      expect(User.count).to eq(2)
    end
  end

  context "when existing user accepts invitation" do
    before do
      invitation.update_columns(recipient_email: user.email)
      send_request :get, accepts_url(token: invitation.token)
    end

    it "returns redirect status" do
      expect(response).to have_http_status(:redirect)
    end

    it "redirects to sign in page" do
      expect(response.location).to include(user_session_path)
    end

    it "return success flash message" do
      expect(flash[:success]).to eq("Invitation accepted")
    end

    it "creates invitation record" do
      expect(User.count).to eq(2)
    end
  end
end
