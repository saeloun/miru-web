# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Users::Passwords#update", type: :request do
  let(:company) { create(:company) }
  let(:user) { create(:user, current_workspace_id: company.id) }

  context "when the password token is valid" do
    before do
      create(:company_user, company:, user:)
      user.add_role :admin, company
      send_request :patch, user_password_path, params: {
        user: {
          email: user.email,
          password: "testpassword",
          reset_password_token: user.send_reset_password_instructions
        }
      }
    end

    it "returns redirect http status" do
      expect(response).to have_http_status(:redirect)
    end

    it "redirects to root_path" do
      expect(response).to redirect_to(root_path)
    end

    it "returns success flash notice" do
      expect(flash[:notice])
        .to eq("Your password has been changed successfully. You are now signed in.")
    end
  end

  context "when the password token is invalid" do
    before do
      create(:company_user, company:, user:)
      user.add_role :admin, company
      send_request :patch, user_password_path, params: {
        user: {
          email: user.email,
          password: "testpassword",
          reset_password_token: "invalid_token"
        }
      }
    end

    it "returns success response" do
      expect(response).to be_successful
    end

    it "returns error flash message" do
      expect(flash[:error]).to eq("Reset password token is invalid")
    end
  end
end
