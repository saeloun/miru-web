# frozen_string_literal: true

require "rails_helper"

RSpec.describe "InternalApi::V1::Companies::index", type: :request do
  let(:company) { create(:company, address_attributes: attributes_for(:address)) }
  let(:user) { create(:user, current_workspace_id: company.id) }

  before do
    create(:employment, company:, user:)
  end

  context "when user is an admin" do
    before do
      user.add_role :admin, company
      sign_in user
      send_request :get, internal_api_v1_companies_path, headers: auth_headers(user)
    end

    it "response should be successful" do
      expect(response).to be_successful
    end

    it "returns success json response" do
      expect(json_response["company_details"]["name"]).to eq(company.name)
      expect(json_response["company_details"]["address"]["address_line_1"]).to eq(company.address.address_line_1)
      expect(json_response["company_details"]["address"]["address_line_2"]).to eq(company.address.address_line_2)
      expect(json_response["company_details"]["address"]["city"]).to eq(company.address.city)
      expect(json_response["company_details"]["address"]["state"]).to eq(company.address.state)
      expect(json_response["company_details"]["address"]["country"]).to eq(company.address.country)
      expect(json_response["company_details"]["address"]["pin"]).to eq(company.address.pin)
    end
  end

  context "when user is an owner" do
    before do
      user.add_role :owner, company
      sign_in user
      send_request :get, internal_api_v1_companies_path, headers: auth_headers(user)
    end

    it "response should be successful" do
      expect(response).to be_successful
    end

    it "returns success json response" do
      expect(json_response["company_details"]["name"]).to eq(company.name)
      expect(json_response["company_details"]["address"]["address_line_1"]).to eq(company.address.address_line_1)
      expect(json_response["company_details"]["address"]["address_line_2"]).to eq(company.address.address_line_2)
      expect(json_response["company_details"]["address"]["city"]).to eq(company.address.city)
      expect(json_response["company_details"]["address"]["state"]).to eq(company.address.state)
      expect(json_response["company_details"]["address"]["country"]).to eq(company.address.country)
      expect(json_response["company_details"]["address"]["pin"]).to eq(company.address.pin)
    end
  end

  context "when user is a book keeper" do
   before do
     user.add_role :book_keeper, company
     sign_in user
     send_request :get, internal_api_v1_companies_path, headers: auth_headers(user)
   end

   it "response should be successful" do
     expect(response).to have_http_status(:ok)
   end

   it "returns success json response" do
     expect(json_response["company_details"]["name"]).to eq(company.name)
     expect(json_response["company_details"]["address"]["address_line_1"]).to eq(company.address.address_line_1)
     expect(json_response["company_details"]["address"]["address_line_2"]).to eq(company.address.address_line_2)
     expect(json_response["company_details"]["address"]["city"]).to eq(company.address.city)
     expect(json_response["company_details"]["address"]["state"]).to eq(company.address.state)
     expect(json_response["company_details"]["address"]["country"]).to eq(company.address.country)
     expect(json_response["company_details"]["address"]["pin"]).to eq(company.address.pin)
   end
 end
end
