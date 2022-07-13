# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Addresses#show", type: :request do
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

  context "when Owner wants to see addresses of employee of his company" do
    before do
      user.add_role :owner, company
      sign_in user
      send_request :get, internal_api_v1_team_addresses_path(employment)
    end

    it "is successful" do
      expect(response).to have_http_status(:ok)
      expect(json_response[0]["address_line_1"]).to eq(JSON.parse(address.address_line_1.to_json))
      expect(json_response[0]["address_line_2"]).to eq(JSON.parse(address.address_line_2.to_json))
      expect(json_response[0]["city"]).to eq(JSON.parse(address.city.to_json))
      expect(json_response[0]["state"]).to eq(JSON.parse(address.state.to_json))
      expect(json_response[0]["country"]).to eq(JSON.parse(address.country.to_json))
      expect(json_response[0]["pin"]).to eq(JSON.parse(address.pin.to_json))
    end
  end

  context "when Admin wants to see addresses of employee of his company" do
    before do
      user.add_role :admin, company
      sign_in user
      send_request :get, internal_api_v1_team_addresses_path(employment)
    end

    it "is successful" do
      expect(response).to have_http_status(:ok)
      expect(json_response[0]["address_line_1"]).to eq(JSON.parse(address.address_line_1.to_json))
      expect(json_response[0]["address_line_2"]).to eq(JSON.parse(address.address_line_2.to_json))
      expect(json_response[0]["city"]).to eq(JSON.parse(address.city.to_json))
      expect(json_response[0]["state"]).to eq(JSON.parse(address.state.to_json))
      expect(json_response[0]["country"]).to eq(JSON.parse(address.country.to_json))
      expect(json_response[0]["pin"]).to eq(JSON.parse(address.pin.to_json))
    end
  end

  context "when logged in user checks his own addresses" do
    before do
      user.add_role :employee, company
      sign_in user
      send_request :get, internal_api_v1_team_addresses_path(employment)
    end

    it "is successful" do
      expect(response).to have_http_status(:ok)
      expect(json_response[0]["address_line_1"]).to eq(JSON.parse(address.address_line_1.to_json))
      expect(json_response[0]["address_line_2"]).to eq(JSON.parse(address.address_line_2.to_json))
      expect(json_response[0]["city"]).to eq(JSON.parse(address.city.to_json))
      expect(json_response[0]["state"]).to eq(JSON.parse(address.state.to_json))
      expect(json_response[0]["country"]).to eq(JSON.parse(address.country.to_json))
      expect(json_response[0]["pin"]).to eq(JSON.parse(address.pin.to_json))
    end
  end

  context "when Owner of a company accesses address of an employee of another company" do
    before do
      employment2 = create(:employment, user: user2, company: company2)
      user.add_role :owner, company
      user2.add_role :employee, company2
      sign_in user
      send_request :get, internal_api_v1_team_addresses_path(employment2)
    end

    it "is unsuccessful" do
      expect(response).to have_http_status(:forbidden)
      expect(json_response["errors"]).to eq("You are not authorized to perform this action.")
    end
  end

  context "when Admin of a company accesses address of an employee of another company" do
    before do
      employment2 = create(:employment, user: user2, company: company2)
      user.add_role :admin, company
      user2.add_role :employee, company2
      sign_in user
      send_request :get, internal_api_v1_team_addresses_path(employment2)
    end

    it "is unsuccessful" do
      expect(response).to have_http_status(:forbidden)
      expect(json_response["errors"]).to eq("You are not authorized to perform this action.")
    end
  end

  context "when Employee wants to see address of an employee from different company" do
    before do
      employment2 = create(:employment, user: user2, company: company2)
      user.add_role :employee, company
      user2.add_role :employee, company2
      sign_in user
      send_request :get, internal_api_v1_team_addresses_path(employment2)
    end

    it "is unsuccessful" do
      expect(response).to have_http_status(:forbidden)
      expect(json_response["errors"]).to eq("You are not authorized to perform this action.")
    end
  end

  context "when Employee wants to see address of another employee from same company" do
    before do
      employment = create(:employment, user:, company:)
      employment2 = create(:employment, user: user2, company:)
      user.add_role :employee, company
      user2.add_role :employee, company
      sign_in user
      send_request :get, internal_api_v1_team_addresses_path(employment2)
    end

    it "is unsuccessful" do
      expect(response).to have_http_status(:forbidden)
      expect(json_response["errors"]).to eq("You are not authorized to perform this action.")
    end
  end
end
