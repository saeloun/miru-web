# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Devices#show", type: :request do
  let(:company) { create(:company) }
  let(:company2) { create(:company) }
  let(:user) { create(:user, current_workspace_id: company.id) }
  let(:user2) { create(:user, current_workspace_id: company2.id) }
  let!(:device) { create(:device, user_id: user.id, company_id: company.id) }
  let!(:device2) { create(:device, user_id: user2.id, company_id: company.id) }

  context "when Owner wants to see Device details of employee of his company" do
    before do
      user.add_role :owner, company
      sign_in user
      send_request :get, internal_api_v1_device_path(device)
    end

    it "is successful" do
      expect(response).to have_http_status(:ok)
      expect(json_response["device_type"]).to eq(device.device_type)
      expect(json_response["name"]).to eq(device.name)
      expect(json_response["serial_number"]).to eq(device.serial_number)
    end
  end

  context "when Admin wants to see Device details of employee of his company" do
    before do
      user.add_role :admin, company
      sign_in user
      send_request :get, internal_api_v1_device_path(device)
    end

    it "is successful" do
      expect(response).to have_http_status(:ok)
      expect(json_response["device_type"]).to eq(device.device_type)
      expect(json_response["name"]).to eq(device.name)
      expect(json_response["serial_number"]).to eq(device.serial_number)
    end
  end

  context "when logged in user checks his own Device details" do
    before do
      user.add_role :employee, company
      sign_in user
      send_request :get, internal_api_v1_device_path(device)
    end

    it "is successful" do
      expect(response).to have_http_status(:ok)
      expect(json_response["device_type"]).to eq(device.device_type)
      expect(json_response["name"]).to eq(device.name)
      expect(json_response["serial_number"]).to eq(device.serial_number)
    end
  end

  context "when Employee wants to see Device details of another employee from same company" do
    before do
      user.add_role :employee, company
      user2.add_role :employee, company
      sign_in user
      send_request :get, internal_api_v1_device_path(device2)
    end

    it "is unsuccessful" do
      expect(response).to have_http_status(:forbidden)
      expect(json_response["errors"]).to eq("You are not authorized to perform this action.")
    end
  end
end
