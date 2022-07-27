# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Devices#update", type: :request do
  let(:company) { create(:company) }
  let(:user) { create(:user, current_workspace_id: company.id) }
  let(:user2) { create(:user, current_workspace_id: company.id) }
  let!(:device) { create(:device, user_id: user.id, company_id: company.id) }
  let!(:device2) { create(:device, user_id: user2.id, company_id: company.id) }
  let!(:updated_device_details) { attributes_for(:device) }

  context "when Owner wants to update Device details of employee of his company" do
    before do
      user.add_role :owner, company
      sign_in user
      send_request :patch, internal_api_v1_device_path(
        id: device.id,
        params: {
          device: updated_device_details
        })
    end

    it "is successful" do
      device.reload
      expect(response).to have_http_status(:ok)
      expect(json_response["device_type"]).to eq("laptop")
      expect(json_response["name"]).to eq(JSON.parse(updated_device_details[:name].to_json))
      expect(json_response["serial_number"]).to eq(JSON.parse(updated_device_details[:serial_number].to_json))
    end
  end

  context "when Admin wants to update Device details of employee of his company" do
    before do
      user.add_role :admin, company
      sign_in user
      send_request :patch, internal_api_v1_device_path(
        id: device.id,
        params: {
          device: updated_device_details
        })
    end

    it "is successful" do
      device.reload
      expect(response).to have_http_status(:ok)
      expect(json_response["device_type"]).to eq("laptop")
      expect(json_response["name"]).to eq(JSON.parse(updated_device_details[:name].to_json))
      expect(json_response["serial_number"]).to eq(JSON.parse(updated_device_details[:serial_number].to_json))
    end
  end

  context "when Employee wants to update his own device details" do
    before do
      user.add_role :employee, company
      sign_in user
      send_request :patch, internal_api_v1_device_path(
        id: device.id,
        params: {
          device: updated_device_details
        })
    end

    it "is successful" do
      device.reload
      expect(response).to have_http_status(:ok)
      expect(json_response["device_type"]).to eq("laptop")
      expect(json_response["name"]).to eq(JSON.parse(updated_device_details[:name].to_json))
      expect(json_response["serial_number"]).to eq(JSON.parse(updated_device_details[:serial_number].to_json))
    end
  end

  context "when logged in user wants to update device details of another employee from his own company" do
    before do
      user.add_role :employee, company
      user2.add_role :employee, company
      sign_in user
      send_request :patch, internal_api_v1_device_path(
        id: device2.id,
        params: {
          device: updated_device_details
        })
    end

    it "is unsuccessful" do
      expect(response).to have_http_status(:forbidden)
      expect(json_response["errors"]).to eq("You are not authorized to perform this action.")
    end
  end
end
