# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Devices#index", type: :request do
  let(:company) { create(:company) }
  let(:company2) { create(:company) }
  let(:user) { create(:user, current_workspace_id: company.id) }
  let(:employee) { create(:user, current_workspace_id: company.id) }
  let!(:device_of_employee) { create(:device, user_id: employee.id, company_id: company.id) }
  let!(:device_of_user) { create(:device, user_id: user.id, company_id: company.id) }

  before do
    create(:employment, company:, user:)
  end

  context "when logged in user is owner" do
    before do
      user.add_role :owner, company
      sign_in user
    end

    context "when owner wants to check his own details" do
      before do
        send_request :get, api_v1_user_devices_path(user), headers: auth_headers(user)
      end

      it "is successful" do
        expect(response).to have_http_status(:ok)
        expect(json_response["devices"][0]["device_type"]).to eq(device_of_user.device_type)
        expect(json_response["devices"][0]["name"]).to eq(device_of_user.name)
        expect(json_response["devices"][0]["serial_number"]).to eq(device_of_user.serial_number)
      end
    end

    context "when owner wants to see record of an employee of his own workspace" do
      before do
        create(:employment, company:, user: employee)
        send_request :get, api_v1_user_devices_path(employee), headers: auth_headers(user)
      end

      it "is successful" do
        expect(response).to have_http_status(:ok)
        expect(json_response["devices"][0]["device_type"]).to eq(device_of_employee.device_type)
        expect(json_response["devices"][0]["name"]).to eq(device_of_employee.name)
        expect(json_response["devices"][0]["serial_number"]).to eq(device_of_employee.serial_number)
      end
    end

    context "when owner wants to check record of an employee of a different workspace" do
      before do
        create(:employment, company: company2, user: employee)
        send_request :get, api_v1_user_devices_path(employee), headers: auth_headers(user)
      end

      it "is forbidden" do
        expect(response).to have_http_status(:forbidden)
      end
    end

    context "when owner sends request for user id which doesnt exist" do
      before do
        send_request :get, api_v1_user_devices_path("abc"), headers: auth_headers(user)
      end

      it "is forbidden" do
        expect(response).to have_http_status(:not_found)
      end
    end
  end

  context "when logged in user is Admin" do
    before do
      user.add_role :admin, company
      sign_in user
    end

    context "when admin wants to check his own details" do
      before do
        send_request :get, api_v1_user_devices_path(user), headers: auth_headers(user)
      end

      it "is successful" do
        expect(response).to have_http_status(:ok)
        expect(json_response["devices"][0]["device_type"]).to eq(device_of_user.device_type)
        expect(json_response["devices"][0]["name"]).to eq(device_of_user.name)
        expect(json_response["devices"][0]["serial_number"]).to eq(device_of_user.serial_number)
      end
    end

    context "when admin sends valid request" do
      before do
        create(:employment, company:, user: employee)
        send_request :get, api_v1_user_devices_path(employee), headers: auth_headers(user)
      end

      it "is successful" do
        expect(response).to have_http_status(:ok)
        expect(json_response["devices"][0]["device_type"]).to eq(device_of_employee.device_type)
        expect(json_response["devices"][0]["name"]).to eq(device_of_employee.name)
        expect(json_response["devices"][0]["serial_number"]).to eq(device_of_employee.serial_number)
      end
    end

    context "when admin sends request for user id which doesnt exist" do
      before do
        user.add_role :admin, company
        sign_in user
        send_request :get, api_v1_user_devices_path("abc"), headers: auth_headers(user)
      end

      it "is forbidden" do
        expect(response).to have_http_status(:not_found)
      end
    end
  end

  context "when logged in user is an Employee" do
    before do
      user.add_role :employee, company
      sign_in user
    end

    context "when employee updates his own record" do
      before do
        create(:employment, company:, user:)
        send_request :get, api_v1_user_devices_path(user), headers: auth_headers(user)
      end

      it "is permitted" do
        expect(response).to have_http_status(:ok)
        expect(json_response["devices"][0]["device_type"]).to eq(device_of_user.device_type)
        expect(json_response["devices"][0]["name"]).to eq(device_of_user.name)
        expect(json_response["devices"][0]["serial_number"]).to eq(device_of_user.serial_number)
      end
    end

    context "when employee wants to see someone else's record" do
      before do
        create(:employment, company:, user: employee)
        send_request :get, api_v1_user_devices_path(employee), headers: auth_headers(user)
      end

      it "is forbidden" do
        expect(response).to have_http_status(:forbidden)
      end
    end
  end
end
