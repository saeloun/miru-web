# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Team#edit", type: :request do
  let (:company) { create(:company) }
  let(:user) { create(:user, company_id: company.id) }

  context "when user is admin" do
    before do
      user.add_role :admin
      sign_in user
      get edit_team_path(user), xhr: true
    end

    it "returns http success" do
      expect(response).to have_http_status(:ok)
    end

    it "admin can access Team#edit page" do
      expect(response).to have_http_status(:ok)
    end
  end

  context "when user is employee" do
    before do
      user.add_role :employee
      sign_in user
      get edit_team_path(user), xhr: true
    end

    it "redirect to root_path" do
      expect(response).to have_http_status(:redirect)
      expect(response).to redirect_to(root_path)
    end

    it "is not permitted to access Team#edit page" do
      expect(flash[:alert]).to eq("You are not authorized to edit team.")
    end
  end

  context "when unauthenticated" do
    it "respond with unauthorized status" do
      get edit_team_path(user), xhr: true
      expect(response).to have_http_status(:unauthorized)
    end
  end
end
