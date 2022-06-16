# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Team#edit", type: :request do
  let(:company) { create(:company) }
  let(:user) { create(:user, current_workspace_id: company.id) }

  context "when user is an admin" do
    before do
      create(:company_user, company:, user:)
      user.add_role :admin, company
      sign_in user
      send_request(:get, edit_team_path(user), xhr: true)
    end

    it "returns http success" do
      expect(response).to have_http_status(:ok)
    end

    it "admin can access Team#edit page" do
      expect(response).to have_http_status(:ok)
    end
  end

  context "when user is an employee" do
    before do
      create(:company_user, company:, user:)
      user.add_role :employee, company
      sign_in user
      send_request(:get, edit_team_path(user), xhr: true)
    end

    it "redirect to root_path" do
      expect(response).to have_http_status(:redirect)
      expect(response).to redirect_to(root_path)
    end

    it "is not permitted to access Team#edit page" do
      expect(flash[:alert]).to eq("You are not authorized to edit team.")
    end
  end

  context "when user is a book keeper" do
    before do
      create(:company_user, company:, user:)
      user.add_role :book_keeper, company
      sign_in user
      send_request(:get, edit_team_path(user), xhr: true)
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
      send_request(:get, edit_team_path(user), xhr: true)
      expect(response).to have_http_status(:unauthorized)
    end
  end
end
