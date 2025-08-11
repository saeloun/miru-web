# frozen_string_literal: true

require "rails_helper"

RSpec.describe "InternalApi::V1::Client#create", type: :request do
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
        client = attributes_for(:client, addresses_attributes: [address_details])
        send_request :post, internal_api_v1_clients_path(client:), headers: auth_headers(user)
        expect(response).to have_http_status(:ok)
        change(Client, :count).by(1)
        change(Address, :count).by(1)
        [ "address", "id", "logo", "name", "phone" ]
        # expect(json_response["client"].keys.sort).to match(expected_attrs)
        expect(json_response["client"]["address"]["address_line_1"]).to eq(address_details[:address_line_1])
        expect(json_response["client"]["address"]["address_line_2"]).to eq(address_details[:address_line_2])
        expect(json_response["client"]["address"]["city"]).to eq(address_details[:city])
        expect(json_response["client"]["address"]["state"]).to eq(address_details[:state])
        expect(json_response["client"]["address"]["country"]).to eq(address_details[:country])
        expect(json_response["client"]["address"]["pin"]).to eq(address_details[:pin])
      end

      it "throws 422 if the name doesn't exist" do
        send_request :post, internal_api_v1_clients_path(
          client: {
            description: "Rspec Test",
            phone: "7777777777",
            addresses_attributes: [attributes_for(:address)]
          }), headers: auth_headers(user)
        expect(response).to have_http_status(:unprocessable_entity)
        expect(json_response["errors"]).to eq("can't be blank")
      end

      it "throws 422 if the address_line_1 is blank" do
        send_request :post, internal_api_v1_clients_path(
          client: {
            name: "ABC",
            description: "Rspec Test",
            phone: "7777777777",
            addresses_attributes: [invalid_address_attributes]
          }), headers: auth_headers(user)
        expect(response).to have_http_status(:unprocessable_entity)
        expect(json_response["errors"]).to eq("Addresses address line 1 can't be blank")
      end
    end
  end

  context "when the user is an employee" do
    before do
      create(:employment, company:, user:)
      user.add_role :employee, company
      sign_in user
      send_request :post, internal_api_v1_clients_path, headers: auth_headers(user)
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
      send_request :post, internal_api_v1_clients_path, headers: auth_headers(user)
    end

    it "is not be permitted to generate a client" do
      expect(response).to have_http_status(:forbidden)
    end
  end

  context "when unauthenticated" do
    it "is not be permitted to generate a client" do
      send_request :post, internal_api_v1_clients_path
      expect(response).to have_http_status(:unauthorized)
      expect(json_response["error"]).to eq(I18n.t("devise.failure.unauthenticated"))
    end
  end
end
