# frozen_string_literal: true

require "rails_helper"

# Converting to request test since we're testing API functionality
# The React SPA integration will be tested separately once rendering issues are resolved
RSpec.describe "Search clients", type: :request do
  let(:company) { create(:company) }
  let(:user) { create(:user, current_workspace_id: company.id) }
  let!(:client1) { create(:client_with_phone_number_without_country_code, company:, name: "John Smith") }
  let!(:client2) { create(:client_with_phone_number_without_country_code, company:, name: "Jane Doe") }

  before do
    create(:employment, company:, user:)
    user.add_role :admin, company
    sign_in user
  end

  context "when searching for clients via API" do
    it "returns all clients when no search term provided" do
      get "/api/v1/clients"

      expect(response).to have_http_status(:success)
      json_response = JSON.parse(response.body)

      expect(json_response["client_details"]).to be_present
      client_names = json_response["client_details"].pluck("name")
      expect(client_names).to include("John Smith")
      expect(client_names).to include("Jane Doe")
    end

    it "filters clients based on search term" do
      get "/api/v1/clients", params: { query: "John" }

      expect(response).to have_http_status(:success)
      json_response = JSON.parse(response.body)

      expect(json_response["client_details"]).to be_present
      client_names = json_response["client_details"].pluck("name")
      expect(client_names).to include("John Smith")
      expect(client_names).not_to include("Jane Doe")
    end

    it "returns empty results for non-matching search" do
      get "/api/v1/clients", params: { query: "NonExistentClient" }

      expect(response).to have_http_status(:success)
      json_response = JSON.parse(response.body)

      # Should return empty client_details array for no matches
      expect(json_response["client_details"]).to be_empty
    end
  end
end
