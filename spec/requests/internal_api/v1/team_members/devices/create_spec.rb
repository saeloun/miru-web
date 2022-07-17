# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Devices#create", type: :request do
  let(:company) { create(:company) }
  let(:company2) { create(:company) }
  let(:user) { create(:user, current_workspace_id: company.id) }
  let(:user2) { create(:user, current_workspace_id: company2.id) }
  let(:employment) { create(:employment, user:, company:) }

  before {
   @device_details = {
     device_type: "mobile",
     name: Faker::Alphanumeric.alphanumeric,
     serial_number: Faker::Number.number(digits: 10)
   }
 }

  context "when Owner wants to create Device details of employee of his company" do
    before do
      user.add_role :owner, company
      sign_in user
      send_request :post, internal_api_v1_team_devices_path(
        team_id: employment.id,
        device: @device_details
      )
    end

    it "is successful" do
      expect(response).to have_http_status(:ok)
      # expect(json_response["device"][0]["device_type"]).to eq(@device_details[:device_type])
      # expect(json_response["device"][0]["name"]).to eq(@device_details[:name])
      # expect(json_response["device"][0]["serial_number"]).to eq(@device_details[:serial_number])
    end
  end

  context "when Admin wants to create Device details of employee of his company" do
    before do
      user.add_role :admin, company
      sign_in user
      send_request :post, internal_api_v1_team_devices_path(
        team_id: employment.id,
        device: @device_details
      )
    end

    it "is successful" do
      expect(response).to have_http_status(:ok)
    end
  end

  context "when logged in user checks his own Device details" do
    before do
      user.add_role :employee, company
      sign_in user
      send_request :post, internal_api_v1_team_devices_path(
        team_id: employment.id,
        device: @device_details
      )
    end

    it "is successful" do
      expect(response).to have_http_status(:ok)
    end
  end

  context "when Owner of a company accesses employee Device details of another company" do
    before do
      employment2 = create(:employment, user: user2, company: company2)
      user.add_role :owner, company
      user2.add_role :employee, company2
      sign_in user
      send_request :post, internal_api_v1_team_devices_path(
        team_id: employment2.id,
        device: @device_details
      )
    end

    it "is unsuccessful" do
      expect(response).to have_http_status(:forbidden)
      expect(json_response["errors"]).to eq("You are not authorized to perform this action.")
    end
  end

  context "when Admin of a company accesses employee's Device details of another company" do
    before do
      employment2 = create(:employment, user: user2, company: company2)
      user.add_role :admin, company
      user2.add_role :employee, company2
      sign_in user
      send_request :post, internal_api_v1_team_devices_path(
        team_id: employment2.id,
        device: @device_details
      )
    end

    it "is unsuccessful" do
      expect(response).to have_http_status(:forbidden)
      expect(json_response["errors"]).to eq("You are not authorized to perform this action.")
    end
  end

  context "when Employee wants to see Device details of another employee from different company" do
    before do
      employment2 = create(:employment, user: user2, company: company2)
      user.add_role :employee, company
      user2.add_role :employee, company2
      sign_in user
      send_request :post, internal_api_v1_team_devices_path(
        team_id: employment2.id,
        device: @device_details
      )
    end

    it "is unsuccessful" do
      expect(response).to have_http_status(:forbidden)
      expect(json_response["errors"]).to eq("You are not authorized to perform this action.")
    end
  end

  context "when Employee wants to see Device details of another employee from same company" do
    before do
      employment = create(:employment, user:, company:)
      employment2 = create(:employment, user: user2, company:)
      user.add_role :employee, company
      user2.add_role :employee, company
      sign_in user
      send_request :post, internal_api_v1_team_devices_path(
        team_id: employment2.id,
        device: @device_details
      )
    end

    it "is unsuccessful" do
      expect(response).to have_http_status(:forbidden)
      expect(json_response["errors"]).to eq("You are not authorized to perform this action.")
    end
  end
end
