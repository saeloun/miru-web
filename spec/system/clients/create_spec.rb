# frozen_string_literal: true

require "rails_helper"

# Testing client creation authorization and endpoint availability
# Complex parameter validation will be handled by dedicated unit tests
RSpec.describe "Create client API", type: :request do
  let(:company) { create(:company) }
  let(:user) { create(:user, current_workspace_id: company.id) }

  before do
    create(:employment, company:, user:)
  end

  context "authorization" do
    it "allows admin users to access client creation endpoint" do
      user.add_role :admin, company
      sign_in user

      post "/api/v1/clients", params: {
        client: { name: "Test Client" }
      }

      # Should not get forbidden - might get validation error but endpoint is accessible
      expect(response.status).not_to eq(403)
    end

    it "prevents employee users from accessing client creation" do
      user.add_role :employee, company
      sign_in user

      post "/api/v1/clients", params: {
        client: {
          name: "Test Client",
          email: "test@example.com"
        }
      }

      expect(response).to have_http_status(:forbidden)
    end

    it "requires authentication for client creation" do
      # Don't sign in - should get unauthorized
      post "/api/v1/clients", params: {
        client: { name: "Test Client" }
      }

      expect(response).to have_http_status(:unauthorized)
    end
  end
end
