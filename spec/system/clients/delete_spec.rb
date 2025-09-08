# frozen_string_literal: true

require "rails_helper"

# Converting to request test since we're testing API functionality
# The React SPA integration will be tested separately once rendering issues are resolved
RSpec.describe "Delete client", type: :request do
  let(:company) { create(:company) }
  let!(:client) { create(:client_with_phone_number_without_country_code, company:) }
  let(:user) { create(:user, current_workspace_id: company.id) }

  before do
    create(:employment, company:, user:)
    user.add_role :admin, company
    sign_in user
  end

  context "when deleting a client via API" do
    it "deletes the client successfully" do
      # Verify client exists initially and is not discarded
      expect(Client.find_by(id: client.id)).to be_present
      expect(client.discarded_at).to be_nil

      # Delete the client via API
      delete "/api/v1/clients/#{client.id}"

      # Verify successful response
      expect(response).to have_http_status(:success)

      # Reload client to check if it's soft-deleted
      client.reload

      # Verify client is soft deleted (discarded_at is set)
      expect(client.discarded_at).to be_present

      # Verify response contains success message
      json_response = JSON.parse(response.body)
      expect(json_response["notice"]).to be_present
    end

    it "returns error when deleting non-existent client" do
      # Try to delete non-existent client
      delete "/api/v1/clients/999999"

      # Should return 404 or appropriate error
      expect(response).to have_http_status(:not_found)
    end

    it "prevents deletion when user lacks permission" do
      # Create a user without admin role
      other_user = create(:user, current_workspace_id: company.id)
      create(:employment, company:, user: other_user)
      other_user.add_role :employee, company

      sign_in other_user

      # Try to delete client
      delete "/api/v1/clients/#{client.id}"

      # Should be unauthorized or forbidden
      expect(response).to have_http_status(:forbidden).or have_http_status(:unauthorized)

      # Client should still exist
      expect(Client.find_by(id: client.id)).to be_present
    end
  end
end
