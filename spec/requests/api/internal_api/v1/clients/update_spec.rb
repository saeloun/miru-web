# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Api::V1::Clients#update", type: :request do
  let(:company) { create(:company) }
  let(:user) { create(:user, current_workspace_id: company.id) }
  let(:client) {
    create(
      :client,
      company:,
      name: "Client", email: "client@example.com"
    )
  }

  context "when user is an admin" do
    before do
      client
      create(:employment, company:, user:)
      user.add_role :admin, company
      sign_in user
    end

    context "when client is valid" do
      before do
        send_request(
          :patch, api_v1_client_path(client), params: {
            client: {
              id: client.id,
              name: "Test Client",
              phone: "Test phone",
              addresses_attributes: [{
                id: client.current_address.id,
                address_line_1: "updated address"
              }]
            }
          }, headers: auth_headers(user))
      end

      it "updates client" do
        client.reload
        expect(client.name).to eq("Test Client")
        expect(client.current_address.address_line_1).to eq("updated address")
      end

      it "returns success json response" do
        expect(json_response["success"]).to match(true)
        expect(json_response["notice"]).to match("Changes saved successfully")
      end
    end

    context "when client is invalid" do
      before do
        send_request(
          :patch, api_v1_client_path(client), params: {
            client: {
              id: client.id,
              name: "",
              email: "",
              phone: "",
              addresses_attributes: [attributes_for(:address)]
            }
          }, headers: auth_headers(user))
      end

      it "returns failed json response" do
        expect(json_response["notice"]).to match("Failed to saved changes")
      end
    end
  end

  context "when user is an employee" do
    before do
      client
      create(:employment, company:, user:)
      user.add_role :employee, company
      sign_in user
      send_request(
        :patch, api_v1_client_path(client), params: {
          client: {
            id: client.id,
            name: "Test Client",
            email: "test@example.com",
            phone: "Test phone",
            addresses_attributes: [attributes_for(:address)]
          }
        }, headers: auth_headers(user))
    end

    it "is not permitted to update client" do
      expect(json_response["errors"]).to match("You are not authorized to update client.")
    end
  end

  context "when user is a book keeper" do
    before do
      client
      create(:employment, company:, user:)
      user.add_role :book_keeper, company
      sign_in user
      send_request(
        :patch, api_v1_client_path(client), params: {
          client: {
            id: client.id,
            name: "Test Client",
            email: "test@example.com",
            phone: "Test phone",
            addresses_attributes: [attributes_for(:address)]
          }
        }, headers: auth_headers(user))
    end

    it "is not permitted to update client" do
      expect(json_response["errors"]).to match("You are not authorized to update client.")
    end
  end

  context "when unauthenticated" do
    it "user will be not be permitted to update client" do
      send_request(
        :patch, api_v1_client_path(client), params: {
          client: {
            id: client.id,
            name: "Test Client",
            email: "test@example.com",
            phone: "Test phone",
            addresses_attributes: [attributes_for(:address)]
          }
        })
      expect(json_response["error"]).to match(I18n.t("devise.failure.unauthenticated"))
    end
  end

  context "when user's current workspace is different" do
    before do
      create(:employment, company:, user:)
      user.add_role :employee, company
      company2 = create(:company)
      create(:employment, company: company2, user:)
      user.add_role :employee, company2
      user.update!(current_workspace_id: company2)
      sign_in user
      send_request(
        :patch, api_v1_client_path(client), params: {
          client: {
            id: client.id,
            name: "Test Client",
            email: "test@example.com",
            phone: "Test phone",
            addresses_attributes: [attributes_for(:address)]
          }
        }, headers: auth_headers(user)
      )
    end

    it "redirects to root path and displays an error message" do
      expect(response).to have_http_status(:forbidden)
      error_json = { "errors" => "User is unauthorized to modify this client's details" }
      expect(JSON.parse(response.body)).to eq(error_json)
    end
  end
end
