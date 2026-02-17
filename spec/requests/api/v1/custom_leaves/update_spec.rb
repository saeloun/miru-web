# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Api::V1::CustomLeaves#update", type: :request do
  let(:company) { create(:company) }
  let(:user) { create(:user, current_workspace_id: company.id) }

  context "when user is an admin" do
    before do
      create(:employment, company:, user:)
      user.add_role :admin, company
      sign_in user
    end

    it "updates custom leaves" do
      patch "/api/v1/custom_leaves/2024",
        params: {
          custom_leaves: {
            add_custom_leaves: [],
            update_custom_leaves: [],
            remove_custom_leaves: []
          }
        },
        headers: auth_headers(user)
      expect(response).to have_http_status(:ok)
      expect(json_response["notice"]).to eq("Custom Leaves updated successfully")
    end
  end

  context "when user is an employee" do
    before do
      create(:employment, company:, user:)
      user.add_role :employee, company
      sign_in user
    end

    it "is not permitted" do
      patch "/api/v1/custom_leaves/2024",
        params: {
          custom_leaves: {
            add_custom_leaves: [],
            update_custom_leaves: [],
            remove_custom_leaves: []
          }
        },
        headers: auth_headers(user)
      expect(response).to have_http_status(:forbidden)
    end
  end

  context "when unauthenticated" do
    it "returns unauthorized" do
      patch "/api/v1/custom_leaves/2024",
        params: {
          custom_leaves: {
            add_custom_leaves: [],
            update_custom_leaves: [],
            remove_custom_leaves: []
          }
        }
      expect(response).to have_http_status(:unauthorized)
    end
  end
end
