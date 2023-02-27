# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Devices#create", type: :request do
  let(:company) { create(:company) }
  let(:company2) { create(:company) }
  let(:user) { create(:user, current_workspace_id: company.id) }
  let(:employee) { create(:user, current_workspace_id: company.id) }
  let(:user2) { create(:user, current_workspace_id: company2.id) }
  let!(:device_details) { attributes_for(:device) }

  before do
    create(:employment, company:, user:)
  end

  context "when logged in user is Owner" do
    before do
      user.add_role :owner, company
      sign_in user
    end

    context "when user wants to create his own device detail" do
      before do
        send_request :post, internal_api_v1_user_devices_path(
          user_id: user.id,
          device: device_details
        ), headers: auth_headers(user)
      end

      it "is successful" do
        expect(response).to have_http_status(:ok)
        expect(json_response["device_type"]).to eq("laptop")
        expect(json_response["name"]).to eq(JSON.parse(device_details[:name].to_json))
        expect(json_response["serial_number"]).to eq(JSON.parse(device_details[:serial_number].to_json))
      end
    end

    context "when user wants to create device detail of an employee of his workspace" do
      before do
        create(:employment, company:, user: employee)
        send_request :post, internal_api_v1_user_devices_path(
          user_id: employee.id,
          device: device_details
        ), headers: auth_headers(user)
      end

      it "is successful" do
        expect(response).to have_http_status(:ok)
        expect(json_response["device_type"]).to eq("laptop")
        expect(json_response["name"]).to eq(JSON.parse(device_details[:name].to_json))
        expect(json_response["serial_number"]).to eq(JSON.parse(device_details[:serial_number].to_json))
      end
    end

    context "when user wants to create device detail of an employee of some other workspace" do
      before do
        create(:employment, company: company2, user: user2)
        send_request :post, internal_api_v1_user_devices_path(
          user_id: user2.id,
          device: device_details
        ), headers: auth_headers(user)
      end

      it "is forbidden" do
        expect(response).to have_http_status(:forbidden)
      end
    end

    context "when user wants to create device detail of an employee who's id does not exist" do
      before do
        create(:employment, company:, user: employee)
        send_request :post, internal_api_v1_user_devices_path(
          user_id: "abc",
          device: device_details
        ), headers: auth_headers(user)
      end

      it "is not found" do
        expect(response).to have_http_status(:not_found)
      end
    end
  end

  context "when logged in user is Admin" do
    before do
      user.add_role :admin, company
      sign_in user
    end

    context "when user wants to create his own device detail" do
      before do
        send_request :post, internal_api_v1_user_devices_path(
          user_id: user.id,
          device: device_details
        ), headers: auth_headers(user)
      end

      it "is successful" do
        expect(response).to have_http_status(:ok)
        expect(json_response["device_type"]).to eq("laptop")
        expect(json_response["name"]).to eq(JSON.parse(device_details[:name].to_json))
        expect(json_response["serial_number"]).to eq(JSON.parse(device_details[:serial_number].to_json))
      end
    end

    context "when user wants to create device detail of an employee" do
      before do
        create(:employment, company:, user: employee)
        send_request :post, internal_api_v1_user_devices_path(
          user_id: employee.id,
          device: device_details
        ), headers: auth_headers(user)
      end

      it "is successful" do
        expect(response).to have_http_status(:ok)
        expect(json_response["device_type"]).to eq("laptop")
        expect(json_response["name"]).to eq(JSON.parse(device_details[:name].to_json))
        expect(json_response["serial_number"]).to eq(JSON.parse(device_details[:serial_number].to_json))
      end
    end
  end

  context "when logged in user is Employee" do
    before do
      user.add_role :employee, company
      sign_in user
    end

    context "when user wants to create his own device detail" do
      before do
        send_request :post, internal_api_v1_user_devices_path(
          user_id: user.id,
          device: device_details
        ), headers: auth_headers(user)
      end

      it "is successful" do
        expect(response).to have_http_status(:ok)
        expect(json_response["device_type"]).to eq("laptop")
        expect(json_response["name"]).to eq(JSON.parse(device_details[:name].to_json))
        expect(json_response["serial_number"]).to eq(JSON.parse(device_details[:serial_number].to_json))
      end
    end

    context "when user wants to create device detail of other employee" do
      before do
        create(:employment, company:, user: employee)
        send_request :post, internal_api_v1_user_devices_path(
          user_id: employee.id,
          device: device_details
        ), headers: auth_headers(user)
      end

      it "is forbidden" do
        expect(response).to have_http_status(:forbidden)
      end
    end
  end
end
