# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Workspaces#update", type: :request do
  let (:company) { create(:company) }
  let (:company_2) { create(:company) }
  let (:user) { create(:user, current_workspace_id: company.id) }

  context "When user is admin" do
    before do
      create(:company_user, company_id: company.id, user_id: user.id)
      create(:company_user, company_id: company_2.id, user_id: user.id)
      user.add_role :admin, company
      user.add_role :employee, company
      sign_in user
      send_request :patch, workspace_path(company_2)
    end

    it "redirects to root page" do
      expect(response).to have_http_status(:redirect)
      expect(response).to redirect_to(root_path)
      expect(flash[:notice]).to eq("Workspace switched successfully")
    end

    it "updates user's current workspace id" do
      user.reload
      expect(user).to have_attributes(current_workspace_id: company_2.id)
    end
  end

  context "When user is employee" do
    before do
      create(:company_user, company_id: company.id, user_id: user.id)
      create(:company_user, company_id: company_2.id, user_id: user.id)
      user.add_role :employee, company
      sign_in user
      send_request :patch, workspace_path(company_2)
    end

    it "redirects to root page" do
      expect(response).to have_http_status(:redirect)
      expect(response).to redirect_to(root_path)
      expect(flash[:notice]).to eq("Workspace switched successfully")
    end

    it "updates user's current workspace id" do
      user.reload
      expect(user).to have_attributes(current_workspace_id: company_2.id)
    end
  end

  context "when unauthenticated" do
    it "user will be redirects to sign in path" do
      send_request :patch, workspace_path(company)
      expect(response).to redirect_to(user_session_path)
      expect(flash[:alert]).to eq("You need to sign in or sign up before continuing.")
    end
  end
end
