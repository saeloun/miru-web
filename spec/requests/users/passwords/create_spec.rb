# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Users::Passwords#create", type: :request do
  let(:company) { create(:company) }
  let(:user) { create(:user, current_workspace_id: company.id) }

  context "when user email address is valid" do
    before do
      create(:employment, company:, user:)
      user.add_role :admin, company
      send_request :post, user_password_path, params: { user: { email: user.email } }
    end

    it "returns redirect status" do
      expect(response).to have_http_status(:redirect)
    end

    it "redirects to login page" do
      expect(response).to redirect_to(new_user_session_path)
    end

    it "returns success flash notice" do
      expect(flash[:notice])
        .to eq("You will receive an email with instructions on how to reset your password in a few minutes.")
    end
  end

  context "when user email address is invalid" do
    before do
      create(:employment, company:, user:)
      user.add_role :admin, company
      send_request :post, user_password_path, params: { user: { email: "test#{user.email}" } }
    end

    it "returns success response" do
      expect(response).to be_successful
    end

    it "returns error flash message" do
      expect(flash[:error]).to eq("Email not found")
    end
  end
end
