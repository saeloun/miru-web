# frozen_string_literal: true

require "rails_helper"

RSpec.describe "InternalApi::V1::Client#create", type: :request do
  let(:company) { create(:company) }
  let(:user) { create(:user, current_workspace_id: company.id) }

  context "when user is an admin" do
    before do
      create(:employment, company:, user:)
      user.add_role :admin, company
      sign_in user
    end

    describe "#create" do
      it "creates the client successfully" do
        client = attributes_for(:client)
        send_request :post, internal_api_v1_clients_path(client:), headers: auth_headers(user)
        expect(response).to have_http_status(:ok)
        expected_attrs = [ "address", "email", "id", "logo", "name", "phone" ]
        expect(json_response.keys.sort).to match(expected_attrs)
      end

      it "throws 422 if the name doesn't exist" do
        send_request :post, internal_api_v1_clients_path(
          client: {
            email: "test@client.com",
            description: "Rspec Test",
            phone: "7777777777",
            address: "Somewhere on Earth"
          }), headers: auth_headers(user)
        expect(response).to have_http_status(:unprocessable_entity)
        expect(json_response["errors"]).to eq("Name can't be blank")
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
