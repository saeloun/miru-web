# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Devices#create", type: :request do
  let(:company) { create(:company) }
  let(:company2) { create(:company) }
  let(:user) { create(:user, current_workspace_id: company.id) }
  let(:user2) { create(:user, current_workspace_id: company2.id) }
  let!(:device_details) { attributes_for(:device) }

  context "when Owner wants to create Device details of employee of his company" do
    before do
      user.add_role :owner, company
      sign_in user
      send_request :post, internal_api_v1_devices_path(
        device: device_details
      )
    end

    it "is successful" do
      expect(response).to have_http_status(:ok)
      expect(json_response["device_type"]).to eq("laptop")
      expect(json_response["name"]).to eq(JSON.parse(device_details[:name].to_json))
      expect(json_response["serial_number"]).to eq(JSON.parse(device_details[:serial_number].to_json))
    end
  end

  context "when Admin wants to create Device details of employee of his company" do
    before do
      user.add_role :admin, company
      sign_in user
      send_request :post, internal_api_v1_devices_path(
        device: device_details
      )
    end

    it "is successful" do
      expect(response).to have_http_status(:ok)
      expect(json_response["device_type"]).to eq("laptop")
      expect(json_response["name"]).to eq(JSON.parse(device_details[:name].to_json))
      expect(json_response["serial_number"]).to eq(JSON.parse(device_details[:serial_number].to_json))
    end
  end

  context "when logged in user create his own Device details" do
    before do
      user.add_role :employee, company
      sign_in user
      send_request :post, internal_api_v1_devices_path(
        device: device_details
      )
    end

    it "is successful" do
      expect(response).to have_http_status(:ok)
      expect(json_response["device_type"]).to eq("laptop")
      expect(json_response["name"]).to eq(JSON.parse(device_details[:name].to_json))
      expect(json_response["serial_number"]).to eq(JSON.parse(device_details[:serial_number].to_json))
    end
  end
end
