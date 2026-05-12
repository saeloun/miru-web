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
              email: "updated@example.com",
              phone: "+14155552671",
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
        expect(client.email).to eq("updated@example.com")
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
        expect(json_response["errors"]).to be_present
      end
    end

    context "phone number validation" do
      it "updates client with valid US phone number" do
        send_request(
          :patch, api_v1_client_path(client), params: {
            client: {
              id: client.id,
              phone: "+14155552671"
            }
          }, headers: auth_headers(user))
        expect(response).to have_http_status(:ok)
        expect(client.reload.phone).to eq("+14155552671")
      end

      it "updates client with valid Indian phone number" do
        send_request(
          :patch, api_v1_client_path(client), params: {
            client: {
              id: client.id,
              phone: "+919876543210"
            }
          }, headers: auth_headers(user))
        expect(response).to have_http_status(:ok)
        expect(client.reload.phone).to eq("+919876543210")
      end

      it "updates client with valid UK phone number" do
        send_request(
          :patch, api_v1_client_path(client), params: {
            client: {
              id: client.id,
              phone: "+442071234567"
            }
          }, headers: auth_headers(user))
        expect(response).to have_http_status(:ok)
        expect(client.reload.phone).to eq("+442071234567")
      end

      it "updates client with blank phone number" do
        send_request(
          :patch, api_v1_client_path(client), params: {
            client: {
              id: client.id,
              phone: ""
            }
          }, headers: auth_headers(user))
        expect(response).to have_http_status(:ok)
        # Empty string is stored as empty string, not nil
        expect(client.reload.phone).to be_blank
      end

      it "returns error for invalid phone number" do
        send_request(
          :patch, api_v1_client_path(client), params: {
            client: {
              id: client.id,
              phone: "123"
            }
          }, headers: auth_headers(user))
        expect(response).to have_http_status(:unprocessable_content)
        expect(json_response["errors"]).to include("Phone is invalid")
      end

      it "returns error for phone number exceeding 15 digits" do
        send_request(
          :patch, api_v1_client_path(client), params: {
            client: {
              id: client.id,
              phone: "+1234567890123456"
            }
          }, headers: auth_headers(user))
        expect(response).to have_http_status(:unprocessable_content)
        expect(json_response["errors"]).to include("Phone cannot exceed 15 digits")
      end

      it "returns error for invalid Indian phone number" do
        send_request(
          :patch, api_v1_client_path(client), params: {
            client: {
              id: client.id,
              phone: "+9198765432101"
            }
          }, headers: auth_headers(user))
        expect(response).to have_http_status(:unprocessable_content)
        expect(json_response["errors"]).to include("Phone is invalid")
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
            phone: "+14155552671",
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
            phone: "+14155552671",
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
            phone: "+14155552671",
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
            phone: "+14155552671",
            addresses_attributes: [attributes_for(:address)]
          }
        }, headers: auth_headers(user)
      )
    end

    it "redirects to root path and displays an error message" do
      expect(response).to have_http_status(:forbidden)
      error_json = { "errors" => I18n.t("pundit.different_workspace") }
      expect(JSON.parse(response.body)).to eq(error_json)
    end
  end
end
