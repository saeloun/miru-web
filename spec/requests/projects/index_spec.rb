# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Projects#index", type: :request do
  before do
    company = create(:company)
    @user = create(:user)
    client = create(:client, company:)
    @project = create(:project, client:)
  end

  context "when authenticated" do
    it "returns http success" do
      sign_in @user

      send_request :get, projects_path, params: { q: @project.name }
      expect(response).to have_http_status(:ok)
    end
  end

  context "when unauthenticated" do
    it "user will be redirects to sign in path" do
      send_request :get, projects_path, params: { q: @project.name }
      expect(response).to redirect_to(user_session_path)
      expect(flash[:alert]).to eq("You need to sign in or sign up before continuing.")
    end
  end
end
