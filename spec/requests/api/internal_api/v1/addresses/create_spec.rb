# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Addresses#create", type: :request do
  let(:company) { create(:company) }
  let(:company2) { create(:company) }
  let(:user) { create(:user, current_workspace_id: company.id) }
  let(:employee) { create(:user, current_workspace_id: company.id) }
  let(:employee2) { create(:user, current_workspace_id: company2.id) }
  let!(:address_details) { attributes_for(:address) }

  before do
    create(:employment, company:, user:)
  end

  context "when logged in user is Owner" do
    before do
      user.add_role :owner, company
      sign_in user
    end

    context "when user wants to create address of an employee of his company" do
      before do
        create(:employment, company:, user: employee)
        send_request :post, api_v1_user_addresses_path(
          user_id: employee.id,
          params: {
            address: address_details
          }), headers: auth_headers(user)
      end

      it "is successful" do
        expect(response).to have_http_status(:ok)
        expect(json_response["address_line_1"]).to eq(address_details[:address_line_1])
        expect(json_response["address_line_2"]).to eq(address_details[:address_line_2])
        expect(json_response["city"]).to eq(address_details[:city])
        expect(json_response["state"]).to eq(address_details[:state])
        expect(json_response["country"]).to eq(address_details[:country])
        expect(json_response["pin"]).to eq(address_details[:pin])
      end
    end

    context "when user wants to create address of an employee outside his company" do
      before do
        create(:employment, company: company2, user: employee2)
        send_request :post, api_v1_user_addresses_path(
          user_id: employee2.id,
          params: {
            address: address_details
          }), headers: auth_headers(user)
      end

      it "is forbidden" do
        expect(response).to have_http_status(:forbidden)
      end
    end

    context "when user wants to create address of invalid User ID" do
      before do
        send_request :post, api_v1_user_addresses_path(
          user_id: "abc",
          params: {
            address: address_details
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

    context "when user wants to create address of an employee of his company" do
      before do
        create(:employment, company:, user: employee)
        send_request :post, api_v1_user_addresses_path(
          user_id: employee.id,
          params: {
            address: address_details
          }), headers: auth_headers(user)
      end

      it "is successful" do
        expect(response).to have_http_status(:ok)
        expect(json_response["address_line_1"]).to eq(address_details[:address_line_1])
        expect(json_response["address_line_2"]).to eq(address_details[:address_line_2])
        expect(json_response["city"]).to eq(address_details[:city])
        expect(json_response["state"]).to eq(address_details[:state])
        expect(json_response["country"]).to eq(address_details[:country])
        expect(json_response["pin"]).to eq(address_details[:pin])
      end
    end

    context "when user wants to create address of an employee outside his company" do
      before do
        create(:employment, company: company2, user: employee2)
        send_request :post, api_v1_user_addresses_path(
          user_id: employee2.id,
          params: {
            address: address_details
          }), headers: auth_headers(user)
      end

      it "is forbidden" do
        expect(response).to have_http_status(:forbidden)
      end
    end

    context "when user wants to create address of invalid User ID" do
      before do
        send_request :post, api_v1_user_addresses_path(
          user_id: "abc",
          params: {
            address: address_details
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

    context "when user wants to create his own address" do
      before do
        send_request :post, api_v1_user_addresses_path(
          user_id: employee.id,
          params: {
            address: address_details
          }), headers: auth_headers(employee)
      end

      it "is successful" do
        expect(response).to have_http_status(:ok)
        expect(json_response["address_line_1"]).to eq(address_details[:address_line_1])
        expect(json_response["address_line_2"]).to eq(address_details[:address_line_2])
        expect(json_response["city"]).to eq(address_details[:city])
        expect(json_response["state"]).to eq(address_details[:state])
        expect(json_response["country"]).to eq(address_details[:country])
        expect(json_response["pin"]).to eq(address_details[:pin])
      end
    end

    context "when user wants to create address of an other employee" do
      before do
        create(:employment, company: company2, user: employee2)
        send_request :post, api_v1_user_addresses_path(
          user_id: employee2.id,
          params: {
            address: address_details
          }), headers: auth_headers(employee)
      end

      it "is forbidden" do
        expect(response).to have_http_status(:forbidden)
      end
    end
  end
end
