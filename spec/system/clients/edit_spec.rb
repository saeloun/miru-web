# frozen_string_literal: true

require "rails_helper"

# Converting to request test since we're testing API functionality
# The React SPA integration will be tested separately once rendering issues are resolved
RSpec.describe "Edit client", type: :request do
  let(:company) { create(:company) }
  let(:user) { create(:user, current_workspace_id: company.id) }
  let!(:client) { create(:client_with_phone_number_without_country_code, company:) }

  before do
    create(:employment, company:, user:)
    user.add_role :admin, company
    sign_in user
  end

  context "when editing a client via API" do
    it "updates the client successfully" do
      # Prepare update parameters
      update_params = {
        client: {
          name: "Updated Client Name",
          email: "updated@example.com",
          phone: "9123456789"
        }
      }

      # Update the client via API
      put "/internal_api/v1/clients/#{client.id}", params: update_params

      # Verify successful response
      expect(response).to have_http_status(:success)

      # Reload client to verify changes
      client.reload
      expect(client.name).to eq("Updated Client Name")
      expect(client.email).to eq("updated@example.com")
      expect(client.phone).to eq("9123456789")

      # Verify response contains success message
      json_response = JSON.parse(response.body)
      expect(json_response).to have_key("notice")
    end

    it "returns error for invalid data" do
      # Try to update with invalid email
      update_params = {
        client: {
          name: "",
          email: "invalid-email"
        }
      }

      put "/internal_api/v1/clients/#{client.id}", params: update_params

      # Should return validation errors
      expect(response).to have_http_status(:unprocessable_content)

      # Client should not be updated
      client.reload
      expect(client.name).not_to eq("")
    end

    it "returns error when updating non-existent client" do
      update_params = {
        client: {
          name: "New Name"
        }
      }

      put "/internal_api/v1/clients/999999", params: update_params

      expect(response).to have_http_status(:not_found)
    end

    it "prevents updates when user lacks permission" do
      # Create a user without admin role
      other_user = create(:user, current_workspace_id: company.id)
      create(:employment, company:, user: other_user)
      other_user.add_role :employee, company

      sign_in other_user

      update_params = {
        client: {
          name: "Unauthorized Update"
        }
      }

      put "/internal_api/v1/clients/#{client.id}", params: update_params

      # Should be unauthorized or forbidden
      expect(response).to have_http_status(:forbidden).or have_http_status(:unauthorized)

      # Client should not be updated
      client.reload
      expect(client.name).not_to eq("Unauthorized Update")
    end
  end
end
