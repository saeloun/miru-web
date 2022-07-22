# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Addresses#update", type: :request do
  let(:company) { create(:company) }
  let(:user) { create(:user, current_workspace_id: company.id) }
  let(:user2) { create(:user, current_workspace_id: company.id) }
  let(:address) { create(:address, addressable: user) }
  let(:address2) { create(:address, addressable: user2) }
  let(:updated_address_details) { attributes_for(:address) }

  context "when Owner wants to update Address details of employee of his company" do
    before do
      user.add_role :owner, company
      sign_in user
      send_request :patch, internal_api_v1_address_path(
        id: address.id,
        params: {
          address: updated_address_details
        })
    end

    it "is successful" do
      address.reload
      expect(response).to have_http_status(:ok)
      expect(json_response["address_line_1"]).to eq(updated_address_details[:address_line_1])
      expect(json_response["address_line_2"]).to eq(updated_address_details[:address_line_2])
      expect(json_response["city"]).to eq(updated_address_details[:city])
      expect(json_response["state"]).to eq(updated_address_details[:state])
      expect(json_response["country"]).to eq(updated_address_details[:country])
      expect(json_response["pin"]).to eq(updated_address_details[:pin])
    end
  end

  context "when Admin wants to update Address details of employee of his company" do
    before do
      user.add_role :admin, company
      sign_in user
      send_request :patch, internal_api_v1_address_path(
        id: address.id,
        params: {
          address: updated_address_details
        })
    end

    it "is successful" do
      address.reload
      expect(response).to have_http_status(:ok)
      expect(json_response["address_line_1"]).to eq(updated_address_details[:address_line_1])
      expect(json_response["address_line_2"]).to eq(updated_address_details[:address_line_2])
      expect(json_response["city"]).to eq(updated_address_details[:city])
      expect(json_response["state"]).to eq(updated_address_details[:state])
      expect(json_response["country"]).to eq(updated_address_details[:country])
      expect(json_response["pin"]).to eq(updated_address_details[:pin])
    end
  end

  context "when Employee wants to update his own Address details" do
    before do
      user.add_role :employee, company
      sign_in user
      send_request :patch, internal_api_v1_address_path(
        id: address.id,
        params: {
          address: updated_address_details
        })
    end

    it "is successful" do
      address.reload
      expect(response).to have_http_status(:ok)
      expect(json_response["address_line_1"]).to eq(updated_address_details[:address_line_1])
      expect(json_response["address_line_2"]).to eq(updated_address_details[:address_line_2])
      expect(json_response["city"]).to eq(updated_address_details[:city])
      expect(json_response["state"]).to eq(updated_address_details[:state])
      expect(json_response["country"]).to eq(updated_address_details[:country])
      expect(json_response["pin"]).to eq(updated_address_details[:pin])
    end
  end

  context "when logged in user wants to update Address details of another employee from his own company" do
    before do
      employment2 = create(:employment, user: user2, company:)
      user.add_role :employee, company
      user2.add_role :employee, company
      sign_in user
      send_request :patch, internal_api_v1_address_path(
        id: address2.id,
        params: {
          address: updated_address_details
        })
    end

    it "is unsuccessful" do
      expect(response).to have_http_status(:forbidden)
      expect(json_response["errors"]).to eq("You are not authorized to perform this action.")
    end
  end
end
