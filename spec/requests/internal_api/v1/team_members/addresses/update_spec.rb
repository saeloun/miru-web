# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Addresses#update", type: :request do
  let(:company) { create(:company) }
  let(:company2) { create(:company) }
  let(:user) { create(:user, current_workspace_id: company.id) }
  let(:user2) { create(:user, current_workspace_id: company2.id) }
  let(:employment) { create(:employment, user:, company:) }
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

  before {
    @updated_address_details = {
      # first name is kept the same for testing, rest all fields are updated
      address_type: "current",
      address_line_1: Faker::Address.full_address,
      address_line_2: Faker::Address.full_address,
      city: Faker::Address.city,
      state: Faker::Address.state,
      country: Faker::Address.country,
      pin: Faker::Address.postcode
    }
  }

  context "when Owner wants to update Address details of employee of his company" do
    before do
      user.add_role :owner, company
      sign_in user
      send_request :patch, internal_api_v1_team_addresses_path(
        team_id: employment.id,
        params: {
          address: @updated_address_details
        })
    end

    it "is successful" do
      address.reload
      expect(response).to have_http_status(:ok)
      expect(json_response["address"]["address_line_1"]).to eq(
        JSON.parse(@updated_address_details[:address_line_1].to_json))
      expect(json_response["address"]["address_line_2"]).to eq(
        JSON.parse(@updated_address_details[:address_line_2].to_json))
      expect(json_response["address"]["city"]).to eq(JSON.parse(@updated_address_details[:city].to_json))
      expect(json_response["address"]["state"]).to eq(JSON.parse(@updated_address_details[:state].to_json))
      expect(json_response["address"]["country"]).to eq(JSON.parse(@updated_address_details[:country].to_json))
      expect(json_response["address"]["pin"]).to eq(JSON.parse(@updated_address_details[:pin].to_json))
    end
  end

  context "when Admin wants to update Address details of employee of his company" do
    before do
      user.add_role :admin, company
      sign_in user
      send_request :patch, internal_api_v1_team_addresses_path(
        team_id: employment.id,
        params: {
          address: @updated_address_details
        })
    end

    it "is successful" do
      address.reload
      expect(response).to have_http_status(:ok)
      expect(json_response["address"]["address_line_1"]).to eq(
        JSON.parse(@updated_address_details[:address_line_1].to_json))
      expect(json_response["address"]["address_line_2"]).to eq(
        JSON.parse(@updated_address_details[:address_line_2].to_json))
      expect(json_response["address"]["city"]).to eq(JSON.parse(@updated_address_details[:city].to_json))
      expect(json_response["address"]["state"]).to eq(JSON.parse(@updated_address_details[:state].to_json))
      expect(json_response["address"]["country"]).to eq(JSON.parse(@updated_address_details[:country].to_json))
      expect(json_response["address"]["pin"]).to eq(JSON.parse(@updated_address_details[:pin].to_json))
    end
  end

  context "when Employee wants to update his own Address details" do
    before do
      user.add_role :employee, company
      sign_in user
      send_request :patch, internal_api_v1_team_addresses_path(
        team_id: employment.id,
        params: {
          address: @updated_address_details
        })
    end

    it "is successful" do
      address.reload
      expect(response).to have_http_status(:ok)
      expect(json_response["address"]["address_line_1"]).to eq(
        JSON.parse(@updated_address_details[:address_line_1].to_json))
      expect(json_response["address"]["address_line_2"]).to eq(
        JSON.parse(@updated_address_details[:address_line_2].to_json))
      expect(json_response["address"]["city"]).to eq(JSON.parse(@updated_address_details[:city].to_json))
      expect(json_response["address"]["state"]).to eq(JSON.parse(@updated_address_details[:state].to_json))
      expect(json_response["address"]["country"]).to eq(JSON.parse(@updated_address_details[:country].to_json))
      expect(json_response["address"]["pin"]).to eq(JSON.parse(@updated_address_details[:pin].to_json))
    end
  end

  context "when logged in user wants to update Address details of another employee from a different company" do
    before do
      employment2 = create(:employment, user: user2, company: company2)
      user.add_role :employee, company
      user2.add_role :employee, company2
      sign_in user
      send_request :patch, internal_api_v1_team_addresses_path(
        team_id: employment2.id,
        params: {
          address: @updated_address_details
        })
    end

    it "is unsuccessful" do
      expect(response).to have_http_status(:forbidden)
      expect(json_response["errors"]).to eq("You are not authorized to perform this action.")
    end
  end

  context "when logged in user wants to update Address details of another employee from his own company" do
    before do
      employment2 = create(:employment, user: user2, company:)
      user.add_role :employee, company
      user2.add_role :employee, company
      sign_in user
      send_request :patch, internal_api_v1_team_addresses_path(
        team_id: employment2.id,
        params: {
          address: @updated_address_details
        })
    end

    it "is unsuccessful" do
      expect(response).to have_http_status(:forbidden)
      expect(json_response["errors"]).to eq("You are not authorized to perform this action.")
    end
  end

  context "when logged in Owner wants to update Address details of another employee from a different company" do
    before do
      employment2 = create(:employment, user: user2, company: company2)
      user.add_role :owner, company
      user2.add_role :employee, company2
      sign_in user
      send_request :patch, internal_api_v1_team_addresses_path(
        team_id: employment2.id,
        params: {
          address: @updated_address_details
        })
    end

    it "is unsuccessful" do
      expect(response).to have_http_status(:forbidden)
      expect(json_response["errors"]).to eq("You are not authorized to perform this action.")
    end
  end

  context "when logged in Admin wants to update Address details of another employee from a different company" do
    before do
      employment2 = create(:employment, user: user2, company: company2)
      user.add_role :admin, company
      user2.add_role :employee, company2
      sign_in user
      send_request :patch, internal_api_v1_team_addresses_path(
        team_id: employment2.id,
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
