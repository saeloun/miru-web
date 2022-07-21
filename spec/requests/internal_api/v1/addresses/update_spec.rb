# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Addresses#update", type: :request do
  let(:company) { create(:company) }
  let(:user) { create(:user, current_workspace_id: company.id) }
  let(:user2) { create(:user, current_workspace_id: company.id) }
  let!(:address) { Address.create(
    addressable: user,
    address_type: "current",
    address_line_1: Faker::Address.full_address,
    address_line_2: Faker::Address.full_address,
    city: Faker::Address.city,
    state: Faker::Address.state,
    country: Faker::Address.country,
    pin: Faker::Address.postcode
    )
  }
  let!(:address2) { Address.create(
    addressable: user2,
    address_type: "current",
    address_line_1: Faker::Address.full_address,
    address_line_2: Faker::Address.full_address,
    city: Faker::Address.city,
    state: Faker::Address.state,
    country: Faker::Address.country,
    pin: Faker::Address.postcode
    )
  }

  before do
    @updated_address_details = {
      address_type: "current",
      address_line_1: Faker::Address.full_address,
      address_line_2: Faker::Address.full_address,
      city: Faker::Address.city,
      state: Faker::Address.state,
      country: Faker::Address.country,
      pin: Faker::Address.postcode
    }
  end

  context "when Owner wants to update Address details of employee of his company" do
    before do
      user.add_role :owner, company
      sign_in user
      send_request :patch, internal_api_v1_address_path(
        id: address.id,
        params: {
          address: @updated_address_details
        })
    end

    it "is successful" do
      address.reload
      expect(response).to have_http_status(:ok)
      expect(json_response["address_line_1"]).to eq(address.address_line_1)
      expect(json_response["address_line_2"]).to eq(address.address_line_2)
      expect(json_response["city"]).to eq(address.city)
      expect(json_response["state"]).to eq(address.state)
      expect(json_response["country"]).to eq(address.country)
      expect(json_response["pin"]).to eq(address.pin)
    end
  end

  context "when Admin wants to update Address details of employee of his company" do
    before do
      user.add_role :admin, company
      sign_in user
      send_request :patch, internal_api_v1_address_path(
        id: address.id,
        params: {
          address: @updated_address_details
        })
    end

    it "is successful" do
      address.reload
      expect(response).to have_http_status(:ok)
      expect(json_response["address_line_1"]).to eq(address.address_line_1)
      expect(json_response["address_line_2"]).to eq(address.address_line_2)
      expect(json_response["city"]).to eq(address.city)
      expect(json_response["state"]).to eq(address.state)
      expect(json_response["country"]).to eq(address.country)
      expect(json_response["pin"]).to eq(address.pin)
    end
  end

  context "when Employee wants to update his own Address details" do
    before do
      user.add_role :employee, company
      sign_in user
      send_request :patch, internal_api_v1_address_path(
        id: address.id,
        params: {
          address: @updated_address_details
        })
    end

    it "is successful" do
      address.reload
      expect(response).to have_http_status(:ok)
      expect(json_response["address_line_1"]).to eq(address.address_line_1)
      expect(json_response["address_line_2"]).to eq(address.address_line_2)
      expect(json_response["city"]).to eq(address.city)
      expect(json_response["state"]).to eq(address.state)
      expect(json_response["country"]).to eq(address.country)
      expect(json_response["pin"]).to eq(address.pin)
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
          address: @updated_address_details
        })
    end

    it "is unsuccessful" do
      expect(response).to have_http_status(:forbidden)
      expect(json_response["errors"]).to eq("You are not authorized to perform this action.")
    end
  end
end
