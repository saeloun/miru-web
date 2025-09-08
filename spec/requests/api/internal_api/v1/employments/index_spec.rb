# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Api::V1::Employments#index", type: :request do
  let(:company1) { create(:company) }
  let(:company2) { create(:company) }
  let(:user1) { create(:user, current_workspace_id: company1.id) }
  let(:user2) { create(:user) }
  let(:user3) { create(:user) }
  let(:user4) { create(:user) }

  before do
    create(:employment, company_id: company1.id, user_id: user1.id)
    create(:employment, company_id: company1.id, user_id: user2.id)
    create(:employment, company_id: company2.id, user_id: user3.id)
    create(:employment, company_id: company1.id, user_id: user4.id)
  end

  context "when user is an admin" do
    before do
      user1.add_role :admin, company1
      sign_in user1
      user4.discard
      send_request :get, api_v1_employments_path, headers: auth_headers(user1)
    end

    it "returns the success" do
      expect(response).to have_http_status(:ok)
    end

    it "returns the users of company1" do
      result = [ { id: user1.id, name: user1.full_name }, { id: user2.id, name: user2.full_name }]
      expect(json_response["users"]).to match_array(JSON.parse(result.to_json))
    end

    it "does not return the discarded users of company1" do
      expect(json_response["users"].pluck("id")).not_to include user4.id
    end

    it "does not return the users of company2" do
      expect(json_response["users"].pluck("id")).not_to include user3.id
    end
  end

  context "when user is an employee" do
    before do
      user1.add_role :employee, company1
      sign_in user1
      send_request :get, api_v1_employments_path, headers: auth_headers(user1)
    end

    it "forbids the user to access the list of users of company" do
      expect(response).to have_http_status(:forbidden)
      expect(json_response["errors"]).to eq("You are not authorized to perform this action.")
    end
  end

  context "when user is a book keeper" do
    before do
      user1.add_role :book_keeper, company1
      sign_in user1
      send_request :get, api_v1_employments_path, headers: auth_headers(user1)
    end

    it "forbids the user to access the list of users of company" do
      expect(response).to have_http_status(:forbidden)
      expect(json_response["errors"]).to eq("You are not authorized to perform this action.")
    end
  end
end
