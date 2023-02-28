# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Devices#update", type: :request do
  let(:company) { create(:company) }
  let(:company2) { create(:company) }
  let(:user) { create(:user, current_workspace_id: company.id) }
  let(:employee) { create(:user, current_workspace_id: company.id) }
  let!(:device_of_employee) { create(:device, user_id: employee.id, company_id: company.id) }
  let!(:device_of_user) { create(:device, user_id: user.id, company_id: company.id) }
  let!(:updated_device_details) { attributes_for(:device) }

  before do
    create(:employment, company:, user:)
  end

  context "when logged in user is Owner" do
    before do
      user.add_role :owner, company
      sign_in user
    end

    context "when user wants to update his own details" do
      before do
        send_request :patch, internal_api_v1_user_device_path(
          user_id: user.id,
          id: device_of_user.id,
          params: {
            device: updated_device_details
          }), headers: auth_headers(user)
      end

      it "is successful" do
        device_of_user.reload
        expect(response).to have_http_status(:ok)
        expect(json_response["device_type"]).to eq("laptop")
        expect(json_response["name"]).to eq(JSON.parse(updated_device_details[:name].to_json))
        expect(json_response["serial_number"]).to eq(JSON.parse(updated_device_details[:serial_number].to_json))
      end
    end

    context "when user wants to update details of an employee of his own workspace" do
      before do
        create(:employment, company:, user: employee)
        send_request :patch, internal_api_v1_user_device_path(
          user_id: employee.id,
          id: device_of_employee.id,
          params: {
            device: updated_device_details
          }), headers: auth_headers(user)
      end

      it "is successful" do
        device_of_employee.reload
        expect(response).to have_http_status(:ok)
        expect(json_response["device_type"]).to eq("laptop")
        expect(json_response["name"]).to eq(JSON.parse(updated_device_details[:name].to_json))
        expect(json_response["serial_number"]).to eq(JSON.parse(updated_device_details[:serial_number].to_json))
      end
    end

    context "when user wants to update details of an employee of a different workspace" do
      before do
        create(:employment, company: company2, user: employee)
        send_request :patch, internal_api_v1_user_device_path(
          user_id: employee.id,
          id: device_of_employee.id,
          params: {
            device: updated_device_details
          }), headers: auth_headers(user)
      end

      it "is forbidden" do
        device_of_employee.reload
        expect(response).to have_http_status(:forbidden)
      end
    end

    context "when user wants to update details of an employee id that does not exist" do
      before do
        send_request :patch, internal_api_v1_user_device_path(
          user_id: "abc",
          id: device_of_employee.id,
          params: {
            device: updated_device_details
          }), headers: auth_headers(user)
      end

      it "is not found" do
        device_of_employee.reload
        expect(response).to have_http_status(:not_found)
      end
    end
  end

  context "when logged in user is Admin" do
    before do
      user.add_role :admin, company
      sign_in user
    end

    context "when user wants to update his own details" do
      before do
        send_request :patch, internal_api_v1_user_device_path(
          user_id: user.id,
          id: device_of_user.id,
          params: {
            device: updated_device_details
          }), headers: auth_headers(user)
      end

      it "is successful" do
        device_of_user.reload
        expect(response).to have_http_status(:ok)
        expect(json_response["device_type"]).to eq("laptop")
        expect(json_response["name"]).to eq(JSON.parse(updated_device_details[:name].to_json))
        expect(json_response["serial_number"]).to eq(JSON.parse(updated_device_details[:serial_number].to_json))
      end
    end

    context "when user wants to update details of an employee of his own workspace" do
      before do
        create(:employment, company:, user: employee)
        send_request :patch, internal_api_v1_user_device_path(
          user_id: employee.id,
          id: device_of_employee.id,
          params: {
            device: updated_device_details
          }), headers: auth_headers(user)
      end

      it "is successful" do
        device_of_employee.reload
        expect(response).to have_http_status(:ok)
        expect(json_response["device_type"]).to eq("laptop")
        expect(json_response["name"]).to eq(JSON.parse(updated_device_details[:name].to_json))
        expect(json_response["serial_number"]).to eq(JSON.parse(updated_device_details[:serial_number].to_json))
      end
    end

    context "when user wants to update details of an employee of a different workspace" do
      before do
        create(:employment, company: company2, user: employee)
        send_request :patch, internal_api_v1_user_device_path(
          user_id: employee.id,
          id: device_of_employee.id,
          params: {
            device: updated_device_details
          }), headers: auth_headers(user)
      end

      it "is forbidden" do
        device_of_employee.reload
        expect(response).to have_http_status(:forbidden)
      end
    end

    context "when user wants to update details of an employee id that does not exist" do
      before do
        send_request :patch, internal_api_v1_user_device_path(
          user_id: "abc",
          id: device_of_employee.id,
          params: {
            device: updated_device_details
          }), headers: auth_headers(user)
      end

      it "is not found" do
        device_of_employee.reload
        expect(response).to have_http_status(:not_found)
      end
    end
  end

  context "when logged in user is Employee" do
    before do
      user.add_role :employee, company
      sign_in user
    end

    context "when user wants to update his own details" do
      before do
        send_request :patch, internal_api_v1_user_device_path(
          user_id: user.id,
          id: device_of_user.id,
          params: {
            device: updated_device_details
          }), headers: auth_headers(user)
      end

      it "is successful" do
        device_of_user.reload
        expect(response).to have_http_status(:ok)
        expect(json_response["device_type"]).to eq("laptop")
        expect(json_response["name"]).to eq(JSON.parse(updated_device_details[:name].to_json))
        expect(json_response["serial_number"]).to eq(JSON.parse(updated_device_details[:serial_number].to_json))
      end
    end

    context "when user wants to update details of an employee of his own workspace" do
      before do
        create(:employment, company:, user: employee)
        send_request :patch, internal_api_v1_user_device_path(
          user_id: employee.id,
          id: device_of_employee.id,
          params: {
            device: updated_device_details
          }), headers: auth_headers(user)
      end

      it "is forbidden" do
        device_of_employee.reload
        expect(response).to have_http_status(:forbidden)
      end
    end

    context "when user wants to update details of an employee of a different workspace" do
      before do
        create(:employment, company: company2, user: employee)
        send_request :patch, internal_api_v1_user_device_path(
          user_id: employee.id,
          id: device_of_employee.id,
          params: {
            device: updated_device_details
          }), headers: auth_headers(user)
      end

      it "is forbidden" do
        device_of_employee.reload
        expect(response).to have_http_status(:forbidden)
      end
    end

    context "when user wants to update details of an employee id that does not exist" do
      before do
        send_request :patch, internal_api_v1_user_device_path(
          user_id: "abc",
          id: device_of_employee.id,
          params: {
            device: updated_device_details
          }), headers: auth_headers(user)
      end

      it "is not found" do
        device_of_employee.reload
        expect(response).to have_http_status(:not_found)
      end
    end
  end
end
