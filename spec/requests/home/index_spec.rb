# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Root#index", type: :request do
  let(:company) { create(:company) }
  let(:user) { create(:user, current_workspace_id: company.id) }

  # Now conditional routing is handled from fromtend.

  context "when unauthenticated" do
    it "wont throw any error as it acts a root controller" do
      send_request :get, root_path
      expect(response).to be_successful
    end

    it "returns 404 for JSON format requests" do
      send_request :get, root_path, headers: { "Accept" => "application/json" }
      expect(response).to have_http_status(:not_found)
    end

    it "raises routing error for .well-known paths" do
      expect {
        send_request :get, "/.well-known/assetlinks.json"
      }.to raise_error(ActionController::RoutingError, /No route matches/)
    end
  end
end
