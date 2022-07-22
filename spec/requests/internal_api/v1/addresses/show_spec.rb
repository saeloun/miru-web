# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Addresses#show", type: :request do
  let(:company) { create(:company) }
  let(:user) { create(:user, current_workspace_id: company.id) }
  let!(:user2) { create(:user, current_workspace_id: company.id) }
  let(:address) { create(:address, addressable: user) }
  let(:address2) { create(:address, addressable: user2) }

  context "when Owner wants to see addresses of employee of his company" do
    before do
      user.add_role :owner, company
      sign_in user
      send_request :get, internal_api_v1_address_path(address)
    end

    it "is successful" do
      expect(response).to have_http_status(:ok)
      expect(json_response["address_line_1"]).to eq(address.address_line_1)
      expect(json_response["address_line_2"]).to eq(address.address_line_2)
      expect(json_response["city"]).to eq(address.city)
      expect(json_response["state"]).to eq(address.state)
      expect(json_response["country"]).to eq(address.country)
      expect(json_response["pin"]).to eq(address.pin)
    end
  end

  context "when Admin wants to see addresses of employee of his company" do
    before do
      user.add_role :admin, company
      sign_in user
      send_request :get, internal_api_v1_address_path(address)
    end

    it "is successful" do
      expect(response).to have_http_status(:ok)
      expect(json_response["address_line_1"]).to eq(address.address_line_1)
      expect(json_response["address_line_2"]).to eq(address.address_line_2)
      expect(json_response["city"]).to eq(address.city)
      expect(json_response["state"]).to eq(address.state)
      expect(json_response["country"]).to eq(address.country)
      expect(json_response["pin"]).to eq(address.pin)
    end
  end

  context "when logged in user checks his own addresses" do
    before do
      user.add_role :employee, company
      sign_in user
      send_request :get, internal_api_v1_address_path(address)
    end

    it "is successful" do
      expect(response).to have_http_status(:ok)
      expect(json_response["address_line_1"]).to eq(address.address_line_1)
      expect(json_response["address_line_2"]).to eq(address.address_line_2)
      expect(json_response["city"]).to eq(address.city)
      expect(json_response["state"]).to eq(address.state)
      expect(json_response["country"]).to eq(address.country)
      expect(json_response["pin"]).to eq(address.pin)
    end
  end

  context "when Employee wants to see address of another employee from same company" do
    before do
      user.add_role :employee, company
      user2.add_role :employee, company
      sign_in user
      send_request :get, internal_api_v1_address_path(address2)
    end

    it "is unsuccessful" do
      expect(response).to have_http_status(:forbidden)
      expect(json_response["errors"]).to eq("You are not authorized to perform this action.")
    end
  end
end
