# frozen_string_literal: true

require "rails_helper"

RSpec.describe "TimeTracking#index", type: :request do
  let (:company) { create(:company) }
  let (:user) { create(:user, current_workspace_id: company.id) }
  let! (:clients) { create_list(:client, 2, company: company) }

  context "when user is admin" do
    before do
      create(:company_user, company_id: company.id, user_id: user.id)
      user.add_role :admin, company
      sign_in user
      send_request :get, time_tracking_index_path
    end

    it "is successful" do
      expect(response).to have_http_status(:ok)
    end

    it "renders index page" do
      expect(response).to render_template(:index)
    end
  end

  context "when unauthenticated" do
    it "user will be redirects to sign in path" do
      send_request :get, time_tracking_index_path
      expect(response).to redirect_to(user_session_path)
      expect(flash[:alert]).to eq("You need to sign in or sign up before continuing.")
    end
  end
end
