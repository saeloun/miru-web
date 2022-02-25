# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Team#update", type: :request do
  let (:company) { create(:company) }
  let (:user) { create(:user, current_workspace_id: company.id) }

  context "when user is admin" do
    before do
      create(:company_user, company_id: company.id, user_id: user.id)
      user.add_role :admin, company
      sign_in user
      send_request(:put, team_path(user), params: {
        user: {
          first_name: "test",
          last_name: "example",
          email: "test@example.com",
          roles: "admin"
        }
      })
    end

    it "is permitted to update user" do
      user.reload
      expect(user.first_name).to eq("test")
      expect(user.last_name).to eq("example")
      expect(user.email).to eq("test@example.com")
    end

    it "redirects to root_path " do
      expect(response).to have_http_status(:redirect)
    end
  end

  context "when user is employee" do
    before do
      create(:company_user, company_id: company.id, user_id: user.id)
      user.add_role :employee, company
      sign_in user
      send_request(:put, team_path(user), params: {
        user: {
          first_name: "test",
          last_name: "example",
          email: "test@example.com",
          roles: "admin"
        }
      })
    end

    it "redirect to root_path" do
      expect(response).to have_http_status(:redirect)
      expect(response).to redirect_to(root_path)
    end

    it "is not permitter to update user" do
      expect(flash[:alert]).to eq("You are not authorized to update team.")
    end
  end

  context "when unauthenticated" do
    it "user will be redirects to sign in path" do
      send_request(:put, team_path(user), params: {
        user: {
          first_name: "test",
          last_name: "example",
          email: "test@example.com",
          roles: "admin"
        }
      })
      expect(response).to redirect_to(user_session_path)
      expect(flash[:alert]).to eq("You need to sign in or sign up before continuing.")
    end
  end
end
