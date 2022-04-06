# frozen_string_literal: true

require "rails_helper"

RSpec.describe "InternalApi::V1::Clients#update", type: :request do
  let(:company) { create(:company) }
  let(:user) { create(:user, current_workspace_id: company.id) }
  let(:client) { create(:client, company:, name: "Client", email: "client@example.com") }

  context "when user is admin" do
    before do
      client
      create(:company_user, company:, user:)
      user.add_role :admin, company
      sign_in user
    end

    context "when client is valid" do
      before do
        send_request(
          :patch, internal_api_v1_client_path(client), params: {
            client: {
              id: client.id,
              name: "Test Client",
              email: "test@example.com",
              phone: "Test phone",
              address: "India"
            }
          })
      end

      it "updates client's name and email" do
        client.reload
        expect(client.name).to eq("Test Client")
        expect(client.email).to eq("test@example.com")
      end

      it "returns success json response" do
        expect(json_response["success"]).to match(true)
        expect(json_response["notice"]).to match("Changes saved successfully")
      end
    end

    context "when client is invalid" do
      before do
        send_request(
          :patch, internal_api_v1_client_path(client), params: {
            client: {
              id: client.id,
              name: "",
              email: "",
              phone: "",
              address: "India"
            }
          })
      end

      it "returns failed json response" do
        expect(json_response["notice"]).to match("Failed to saved changes")
      end
    end
  end

  context "when user is employee" do
    before do
      client
      create(:company_user, company:, user:)
      user.add_role :employee, company
      sign_in user
      send_request(
        :patch, internal_api_v1_client_path(client), params: {
          client: {
            id: client.id,
            name: "Test Client",
            email: "test@example.com",
            phone: "Test phone",
            address: "India"
          }
        })
    end

    it "is not permitted to update client" do
      expect(json_response["errors"]).to match("You are not authorized to update client.")
    end
  end

  context "when unauthenticated" do
    it "user will be not be permitted to update client" do
      send_request(
        :patch, internal_api_v1_client_path(client), params: {
          client: {
            id: client.id,
            name: "Test Client",
            email: "test@example.com",
            phone: "Test phone",
            address: "India"
          }
        })
      expect(json_response["error"]).to match("You need to sign in or sign up before continuing.")
    end
  end
end
