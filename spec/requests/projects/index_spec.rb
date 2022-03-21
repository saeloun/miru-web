# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Projects#index", type: :request do
  context "when authenticated" do
    it "returns http success" do
      send_request :get, projects_path
      expect(response).to have_http_status(:found)
    end
  end

  context "when unauthenticated" do
    it "user will be redirects to sign in path" do
      send_request :get, projects_path
      expect(response).to redirect_to(user_session_path)
      expect(flash[:alert]).to eq("You need to sign in or sign up before continuing.")
    end
  end
end
