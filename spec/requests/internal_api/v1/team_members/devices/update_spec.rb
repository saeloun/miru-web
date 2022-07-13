# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Devices#update", type: :request do
  let(:company) { create(:company) }
  let(:company2) { create(:company) }
  let(:user) { create(:user, current_workspace_id: company.id) }
  let(:user2) { create(:user, current_workspace_id: company2.id) }
  let(:employment) { create(:employment, user:, company:) }
  let!(:device) { Device.create(
    user_id: user.id,
    company_id: company.id,
    device_type: "mobile",
    name: Faker::Alphanumeric.alphanumeric,
    serial_number: Faker::Number.number(digits: 10),
    specifications: {
      "ram": "RAM 8GB",
      "graphics": "XYZ",
      "processor": "ABC"
    }
    )
  }

  before {
    @updated_device_details = {
      user_id: user.id,
      company_id: company.id,
      device_type: "mobile",
      name: Faker::Alphanumeric.alphanumeric,
      serial_number: Faker::Number.number(digits: 10),
      specifications: {
        "ram": "RAM 16GB",
        "graphics": "1233`",
        "processor": "4355"
      }
    }
  }

  context "when Owner wants to update Device details of employee of his company" do
    before do
      user.add_role :owner, company
      sign_in user
      send_request :patch, internal_api_v1_team_devices_path(
        team_id: employment.id,
        params: {
          device: @updated_device_details
        })
    end

    it "is successful" do
      device.reload
      expect(response).to have_http_status(:ok)
      debugger
    end
  end

  context "when Admin wants to update Device details of employee of his company" do
    before do
      user.add_role :admin, company
      sign_in user
      send_request :patch, internal_api_v1_team_devices_path(
        team_id: employment.id,
        params: {
          device: @updated_device_details
        })
    end

    it "is successful" do
      user.reload
      expect(response).to have_http_status(:ok)
    end
  end

  context "when Employee wants to update his own device details" do
    before do
      user.add_role :employee, company
      sign_in user
      send_request :patch, internal_api_v1_team_devices_path(
        team_id: employment.id,
        params: {
          device: @updated_device_details
        })
    end

    it "is successful" do
      user.reload
      expect(response).to have_http_status(:ok)
    end
  end

  context "when logged in user wants to update device details of another employee from a different company" do
    before do
      employment2 = create(:employment, user: user2, company: company2)
      user.add_role :employee, company
      user2.add_role :employee, company2
      sign_in user
      send_request :patch, internal_api_v1_team_devices_path(
        team_id: employment2.id,
        params: {
          device: @updated_device_details
        })
    end

    it "is unsuccessful" do
      expect(response).to have_http_status(:forbidden)
      expect(json_response["errors"]).to eq("You are not authorized to perform this action.")
    end
  end

  context "when logged in user wants to update device details of another employee from his own company" do
    before do
      employment2 = create(:employment, user: user2, company:)
      user.add_role :employee, company
      user2.add_role :employee, company
      sign_in user
      send_request :patch, internal_api_v1_team_devices_path(
        team_id: employment2.id,
        params: {
          device: @updated_device_details
        })
    end

    it "is unsuccessful" do
      expect(response).to have_http_status(:forbidden)
      expect(json_response["errors"]).to eq("You are not authorized to perform this action.")
    end
  end

  context "when logged in Owner wants to update device details of another employee from a different company" do
    before do
      employment2 = create(:employment, user: user2, company: company2)
      user.add_role :owner, company
      user2.add_role :employee, company2
      sign_in user
      send_request :patch, internal_api_v1_team_devices_path(
        team_id: employment2.id,
        params: {
          device: @updated_device_details
        })
    end

    it "is unsuccessful" do
      expect(response).to have_http_status(:forbidden)
      expect(json_response["errors"]).to eq("You are not authorized to perform this action.")
    end
  end

  context "when logged in Admin wants to update device details of another employee from a different company" do
    before do
      employment2 = create(:employment, user: user2, company: company2)
      user.add_role :admin, company
      user2.add_role :employee, company2
      sign_in user
      send_request :patch, internal_api_v1_team_devices_path(
        team_id: employment2.id,
        params: {
          device: @updated_device_details
        })
    end

    it "is unsuccessful" do
      expect(response).to have_http_status(:forbidden)
      expect(json_response["errors"]).to eq("You are not authorized to perform this action.")
    end
  end
end
