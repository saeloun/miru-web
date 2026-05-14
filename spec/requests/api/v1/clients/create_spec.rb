# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Api::V1::Client#create", type: :request do
  let(:company) { create(:company) }
  let(:user) { create(:user, current_workspace_id: company.id) }
  let(:invalid_address_attributes) { { city: "Brooklyn", state: "NY", country: "US", pin: "12238" } }
  let!(:invitation) { create(:invitation, company:, role: "client") }

  context "when user is an admin" do
    before do
      send_request :get, invitations_accepts_url(token: invitation.token)
      create(:employment, company:, user:)
      user.add_role :admin, company
      sign_in user
    end

    describe "#create" do
      it "creates the client successfully" do
        address_details = attributes_for(:address)
        client = attributes_for(:client, ein: "12-3456789", addresses_attributes: [address_details])
        send_request :post, api_v1_clients_path(client:), headers: auth_headers(user)
        expect(response).to have_http_status(:created)
        change(Client, :count).by(1)
        change(Address, :count).by(1)
        expect(json_response["client"]["email"]).to eq(client[:email])
        expect(json_response["client"]["ein"]).to eq("12-3456789")
        expect(Client.last.ein).to eq("12-3456789")
        expect(json_response["client"]["address"]["address_line_1"]).to eq(address_details[:address_line_1])
        expect(json_response["client"]["address"]["address_line_2"]).to eq(address_details[:address_line_2])
        expect(json_response["client"]["address"]["city"]).to eq(address_details[:city])
        expect(json_response["client"]["address"]["state"]).to eq(address_details[:state])
        expect(json_response["client"]["address"]["country"]).to eq(address_details[:country])
        expect(json_response["client"]["address"]["pin"]).to eq(address_details[:pin])
      end

      it "throws 422 if the name doesn't exist" do
        send_request :post, api_v1_clients_path(
          client: {
            description: "Rspec Test",
            phone: "7777777777",
            addresses_attributes: [attributes_for(:address)]
          }), headers: auth_headers(user)
        expect(response).to have_http_status(:unprocessable_content)
        expect(json_response["errors"]).to eq("can't be blank")
      end

      it "throws 422 if the address_line_1 is blank" do
        send_request :post, api_v1_clients_path(
          client: {
            name: "ABC",
            description: "Rspec Test",
            phone: "7777777777",
            addresses_attributes: [invalid_address_attributes]
          }), headers: auth_headers(user)
        expect(response).to have_http_status(:unprocessable_content)
        expect(json_response["errors"]).to eq("Addresses address line 1 can't be blank")
      end

      it "creates client when email is blank and another blank-email client already exists" do
        create(:client, company:, email: "")
        address_details = attributes_for(:address)
        client = attributes_for(:client, email: "", addresses_attributes: [address_details])

        send_request :post, api_v1_clients_path(client:), headers: auth_headers(user)

        expect(response).to have_http_status(:created)
        expect(json_response.dig("client", "email")).to be_nil
      end

      it "throws 422 when email already exists in same company" do
        existing = create(:client, company:, email: "existing@example.com")
        address_details = attributes_for(:address)
        client = attributes_for(:client, email: existing.email, addresses_attributes: [address_details])

        send_request :post, api_v1_clients_path(client:), headers: auth_headers(user)

        expect(response).to have_http_status(:unprocessable_content)
        expect(json_response["errors"]).to eq("Email has already been taken")
      end

      context "phone number validation" do
        it "creates client with valid US phone number" do
          address_details = attributes_for(:address)
          client = attributes_for(:client, phone: "+14155552671", addresses_attributes: [address_details])
          send_request :post, api_v1_clients_path(client:), headers: auth_headers(user)
          expect(response).to have_http_status(:created)
          expect(json_response["client"]["phone"]).to eq("+14155552671")
        end

        it "creates client with valid Indian phone number" do
          address_details = attributes_for(:address)
          client = attributes_for(:client, phone: "+919876543210", addresses_attributes: [address_details])
          send_request :post, api_v1_clients_path(client:), headers: auth_headers(user)
          expect(response).to have_http_status(:created)
          expect(json_response["client"]["phone"]).to eq("+919876543210")
        end

        it "creates client with valid UK phone number" do
          address_details = attributes_for(:address)
          client = attributes_for(:client, phone: "+442071234567", addresses_attributes: [address_details])
          send_request :post, api_v1_clients_path(client:), headers: auth_headers(user)
          expect(response).to have_http_status(:created)
          expect(json_response["client"]["phone"]).to eq("+442071234567")
        end

        it "creates client with blank phone number" do
          address_details = attributes_for(:address)
          client = attributes_for(:client, phone: "", addresses_attributes: [address_details])
          send_request :post, api_v1_clients_path(client:), headers: auth_headers(user)
          expect(response).to have_http_status(:created)
        end

        it "throws 422 for invalid phone number" do
          address_details = attributes_for(:address)
          client = attributes_for(:client, phone: "123", addresses_attributes: [address_details])
          send_request :post, api_v1_clients_path(client:), headers: auth_headers(user)
          expect(response).to have_http_status(:unprocessable_content)
          expect(json_response["errors"]).to include("Phone is invalid")
        end

        it "throws 422 for phone number exceeding 15 digits" do
          address_details = attributes_for(:address)
          client = attributes_for(:client, phone: "+1234567890123456", addresses_attributes: [address_details])
          send_request :post, api_v1_clients_path(client:), headers: auth_headers(user)
          expect(response).to have_http_status(:unprocessable_content)
          expect(json_response["errors"]).to include("Phone cannot exceed 15 digits")
        end

        it "throws 422 for invalid Indian phone number" do
          address_details = attributes_for(:address)
          client = attributes_for(:client, phone: "+9198765432101", addresses_attributes: [address_details])
          send_request :post, api_v1_clients_path(client:), headers: auth_headers(user)
          expect(response).to have_http_status(:unprocessable_content)
          expect(json_response["errors"]).to include("Phone is invalid")
        end
      end
    end
  end

  context "when the user is an employee" do
    before do
      create(:employment, company:, user:)
      user.add_role :employee, company
      sign_in user
      send_request :post, api_v1_clients_path, headers: auth_headers(user)
    end

    it "is not be permitted to generate a client" do
      expect(response).to have_http_status(:forbidden)
    end
  end

  context "when the user is an book keeper" do
    before do
      create(:employment, company:, user:)
      user.add_role :book_keeper, company
      sign_in user
      send_request :post, api_v1_clients_path, headers: auth_headers(user)
    end

    it "is not be permitted to generate a client" do
      expect(response).to have_http_status(:forbidden)
    end
  end

  context "when unauthenticated" do
    it "is not be permitted to generate a client" do
      send_request :post, api_v1_clients_path
      expect(response).to have_http_status(:unauthorized)
      expect(json_response["error"]).to eq(I18n.t("devise.failure.unauthenticated"))
    end
  end
end
