# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Client#index", type: :request do
  let(:company) { create(:company) }
  let(:user) { create(:user, current_workspace_id: company.id) }
  let(:client) { create(:client, company:) }
  let(:project) { create(:project, client:) }

  context "when user is admin" do
    before do
      create(:company_user, company:, user:)
      user.add_role :admin, company
      create(:timesheet_entry, user:, project:)
      sign_in user
      send_request :get, clients_path
    end

    it "is successful" do
      expect(response).to be_successful
    end

    it "renders Client#index page" do
      expect(response.body).to include("Clients")
    end
  end

  context "when user is employee" do
    before do
      create(:company_user, company:, user:)
      user.add_role :employee, company
      create(:timesheet_entry, user:, project:)
      sign_in user
      send_request :get, clients_path
    end

    it "renders Client#index page" do
      expect(response.body).to include("Clients")
    end
  end

  context "when unauthenticated" do
    it "user will be redirects to sign in path" do
      send_request :get, clients_path
      expect(response).to redirect_to(user_session_path)
      expect(flash[:alert]).to eq("You need to sign in or sign up before continuing.")
    end
  end
end
