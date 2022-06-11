# frozen_string_literal: true

require "rails_helper"

RSpec.describe "InternalApi::V1::Companies::index", type: :request do
  let(:company1) { create(:company) }
  let(:user1) { create(:user, current_workspace_id: company1.id) }

  before do
    create(:company_user, company_id: company1.id, user_id: user1.id)
  end

  context "when user is admin" do
    before do
      user1.add_role :admin, company1
      sign_in user1
      send_request :get, internal_api_v1_companies_path
    end

    it "response should be successful" do
      expect(response).to be_successful
    end

    it "returns success json response" do
      expect(json_response["name"]).to eq(company1.name)
    end
  end

  context "when user is book keeper" do
    before do
      user1.add_role :book_keeper, company1
      sign_in user1
      send_request :get, internal_api_v1_companies_path
    end

    it "response should be successful" do
      expect(response).to be_successful
    end

    it "returns success json response" do
      expect(json_response["company"]["name"]).to eq(company1.name)
    end
  end
end
