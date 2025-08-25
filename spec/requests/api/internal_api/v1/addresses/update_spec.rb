# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Addresses#update", type: :request do
  let(:company) { create(:company) }
  let(:company2) { create(:company) }
  let(:user) { create(:user, current_workspace_id: company.id) }
  let(:employee) { create(:user, current_workspace_id: company.id) }
  let(:employee2) { create(:user, current_workspace_id: company2.id) }
  let!(:employee_address) { create(:address, addressable_type: "User", addressable_id: employee.id) }
  let!(:employee2_address) { create(:address, addressable_type: "User", addressable_id: employee2.id) }
  let!(:company_address) { company.current_address }
  let!(:company2_address) { company2.current_address }
  let!(:updated_address_details) { attributes_for(:address) }

  before do
    create(:employment, company:, user:)
  end

  context "when logged in user is Owner" do
    before do
      user.add_role :owner, company
      sign_in user
    end

    context "when user wants to update address of an employee of his company" do
      before do
        create(:employment, company:, user: employee)
        send_request :patch, api_v1_user_address_path(
          user_id: employee.id,
          id: employee_address.id,
          params: {
            address: updated_address_details
          }), headers: auth_headers(user)
      end

      it "is successful" do
        employee_address.reload
        expect(response).to have_http_status(:ok)
        expect(json_response["address_line_1"]).to eq(employee_address[:address_line_1])
        expect(json_response["address_line_2"]).to eq(employee_address[:address_line_2])
        expect(json_response["city"]).to eq(employee_address[:city])
        expect(json_response["state"]).to eq(employee_address[:state])
        expect(json_response["country"]).to eq(employee_address[:country])
        expect(json_response["pin"]).to eq(employee_address[:pin])
      end
    end

    context "when user wants to update address of his Company" do
      before do
        send_request :patch, api_v1_company_address_path(
          company_id: company.id,
          id: company_address.id,
          params: {
            address: updated_address_details
          }), headers: auth_headers(user)
      end

      it "is successful" do
        company_address.reload
        expect(response).to have_http_status(:ok)
        expect(json_response["address_line_1"]).to eq(company_address[:address_line_1])
        expect(json_response["address_line_2"]).to eq(company_address[:address_line_2])
        expect(json_response["city"]).to eq(company_address[:city])
        expect(json_response["state"]).to eq(company_address[:state])
        expect(json_response["country"]).to eq(company_address[:country])
        expect(json_response["pin"]).to eq(company_address[:pin])
      end
    end

    context "when user wants to update address of an employee outside his company" do
      before do
        create(:employment, company: company2, user: employee2)
        send_request :patch, api_v1_user_address_path(
          user_id: employee2.id,
          id: employee2_address.id,
          params: {
            address: updated_address_details
          }), headers: auth_headers(user)
      end

      it "is forbidden" do
        expect(response).to have_http_status(:forbidden)
      end
    end

    context "when user wants to update address of some other company" do
      before do
        send_request :patch, api_v1_company_address_path(
          company_id: company2.id,
          id: company2_address.id,
          params: {
            address: updated_address_details
          }), headers: auth_headers(user)
      end

      it "is forbidden" do
        expect(response).to have_http_status(:forbidden)
      end
    end

    context "when user wants to update address of invalid User ID" do
      before do
        send_request :patch, api_v1_user_address_path(
          user_id: "abc",
          id: "abc",
          params: {
            address: updated_address_details
          }), headers: auth_headers(user)
      end

      it "is not found" do
        expect(response).to have_http_status(:not_found)
      end
    end

    context "when user wants to update address of invalid company ID" do
      before do
        send_request :patch, api_v1_company_address_path(
          company_id: "abc",
          id: "abc",
          params: {
            address: updated_address_details
          }), headers: auth_headers(user)
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

    context "when user wants to update address of an employee of his company" do
      before do
        create(:employment, company:, user: employee)
        send_request :patch, api_v1_user_address_path(
          user_id: employee.id,
          id: employee_address.id,
          params: {
            address: updated_address_details
          }), headers: auth_headers(user)
      end

      it "is successful" do
        employee_address.reload
        expect(response).to have_http_status(:ok)
        expect(json_response["address_line_1"]).to eq(employee_address[:address_line_1])
        expect(json_response["address_line_2"]).to eq(employee_address[:address_line_2])
        expect(json_response["city"]).to eq(employee_address[:city])
        expect(json_response["state"]).to eq(employee_address[:state])
        expect(json_response["country"]).to eq(employee_address[:country])
        expect(json_response["pin"]).to eq(employee_address[:pin])
      end
    end

    context "when user wants to update address of his Company" do
      before do
        send_request :patch, api_v1_company_address_path(
          company_id: company.id,
          id: company_address.id,
          params: {
            address: updated_address_details
          }), headers: auth_headers(user)
      end

      it "is successful" do
        company_address.reload
        expect(response).to have_http_status(:ok)
        expect(json_response["address_line_1"]).to eq(company_address[:address_line_1])
        expect(json_response["address_line_2"]).to eq(company_address[:address_line_2])
        expect(json_response["city"]).to eq(company_address[:city])
        expect(json_response["state"]).to eq(company_address[:state])
        expect(json_response["country"]).to eq(company_address[:country])
        expect(json_response["pin"]).to eq(company_address[:pin])
      end
    end

    context "when user wants to update address of an employee outside his company" do
      before do
        create(:employment, company: company2, user: employee2)
        send_request :patch, api_v1_user_address_path(
          user_id: employee2.id,
          id: employee2_address.id,
          params: {
            address: updated_address_details
          }), headers: auth_headers(user)
      end

      it "is forbidden" do
        expect(response).to have_http_status(:forbidden)
      end
    end

    context "when user wants to update address of some other company" do
      before do
        send_request :patch, api_v1_company_address_path(
          company_id: company2.id,
          id: company2_address.id,
          params: {
            address: updated_address_details
          }), headers: auth_headers(user)
      end

      it "is forbidden" do
        expect(response).to have_http_status(:forbidden)
      end
    end

    context "when user wants to update address of invalid User ID" do
      before do
        send_request :patch, api_v1_user_address_path(
          user_id: "abc",
          id: "abc",
          params: {
            address: updated_address_details
          }), headers: auth_headers(user)
      end

      it "is not found" do
        expect(response).to have_http_status(:not_found)
      end
    end

    context "when user wants to update address of invalid company ID" do
      before do
        send_request :patch, api_v1_company_address_path(
          company_id: "abc",
          id: "abc",
          params: {
            address: updated_address_details
          }), headers: auth_headers(user)
      end

      it "is not found" do
        expect(response).to have_http_status(:not_found)
      end
    end
  end

  context "when logged in user is an Employee" do
    before do
      employee.add_role :employee, company
      create(:employment, company:, user: employee)
      sign_in employee
    end

    context "when user wants to update his own address" do
      before do
        send_request :patch, api_v1_user_address_path(
          user_id: employee.id,
          id: employee_address.id,
          params: {
            address: updated_address_details
          }), headers: auth_headers(employee)
      end

      it "is successful" do
        employee_address.reload
        expect(response).to have_http_status(:ok)
        expect(json_response["address_line_1"]).to eq(employee_address[:address_line_1])
        expect(json_response["address_line_2"]).to eq(employee_address[:address_line_2])
        expect(json_response["city"]).to eq(employee_address[:city])
        expect(json_response["state"]).to eq(employee_address[:state])
        expect(json_response["country"]).to eq(employee_address[:country])
        expect(json_response["pin"]).to eq(employee_address[:pin])
      end
    end

    context "when user wants to update address of an other employee" do
      before do
        create(:employment, company: company2, user: employee2)
        send_request :patch, api_v1_user_address_path(
          user_id: employee2.id,
          id: employee2_address.id,
          params: {
            address: updated_address_details
          }), headers: auth_headers(employee)
      end

      it "is forbidden" do
        expect(response).to have_http_status(:forbidden)
      end
    end

    context "when user wants to update address of some his own company" do
      before do
        send_request :patch, api_v1_company_address_path(
          company_id: company.id,
          id: company_address.id,
          params: {
            address: updated_address_details
          }), headers: auth_headers(employee)
      end

      it "is forbidden" do
        expect(response).to have_http_status(:forbidden)
      end
    end
  end
end
