# frozen_string_literal: true

require "rails_helper"

RSpec.describe "InternalApi::V1::Companies::index", type: :request do
  let(:company) { create(:company) }
  let(:user) { create(:user, current_workspace_id: company.id) }

  before do
    create(:employment, company:, user:)
  end

  context "when user is an admin" do
    before do
      user.add_role :admin, company
      sign_in user
      send_request :get, internal_api_v1_companies_path
    end

    it "response should be successful" do
      expect(response).to be_successful
    end

    it "returns success json response" do
      expect(json_response["company_details"]["name"]).to eq(company.name)
      expect(json_response["company_details"]["address"]).to eq(company.address)
    end
  end

  context "when user is an owner" do
    before do
      user.add_role :owner, company
      sign_in user
      send_request :get, internal_api_v1_companies_path
    end

    it "response should be successful" do
      expect(response).to be_successful
    end

    it "returns success json response" do
      expect(json_response["company_details"]["name"]).to eq(company.name)
      expect(json_response["company_details"]["address"]).to eq(company.address)
    end
  end

  context "when user is a book keeper" do
   before do
     user.add_role :book_keeper, company
     sign_in user
     send_request :get, internal_api_v1_companies_path
   end

   it "response should be successful" do
     expect(response).to have_http_status(:ok)
   end

   it "returns success json response" do
     expect(json_response["company_details"]["name"]).to eq(company.name)
     expect(json_response["company_details"]["address"]).to eq(company.address)
   end
 end
end
