# frozen_string_literal: true

require "rails_helper"

RSpec.describe "InternalApi::V1::Clients#update", type: :request do
  let(:company) { create(:company) }
  let(:user) { create(:user, current_workspace_id: company.id) }

  context "when user is admin" do
    before do
      @client = create(:client, company:, name: "Client", email: "client@example.com")
      create(:company_user, company_id: company.id, user_id: user.id)
      user.add_role :admin, company
      sign_in user
    end

    context "when client is valid" do
      before do
        send_request(
          :patch, internal_api_v1_client_path(@client), params: {
            client: {
              id: @client.id,
              name: "Test Client",
              email: "test@example.com",
              phone: "Test phone",
              address: "India"
            }
          })
      end

      it "updates client's name and email" do
        @client.reload
        expect(@client.name).to eq("Test Client")
        expect(@client.email).to eq("test@example.com")
      end

      it "returns success json response" do
        expect(json_response["success"]).to match(true)
        expect(json_response["notice"]).to match("Changes saved successfully")
      end
    end

    # context "when client is invalid" do
    #   before do
    #     send_request(:patch, internal_api_v1_client_path(@client), params: {
    #       client: {
    #         name: "",
    #         email: "",
    #         phone: "",
    #         address: "",
    #       }
    #     })
    #   end

    #   it "will fail" do
    #     expect(response.body).to include("Client creation failed")
    #   end

    #   it "will not be created" do
    #     expect(Client.count).to eq(0)
    #   end

    #   it "redirects to root_path" do
    #     expect(response).to have_http_status(:unprocessable_entity)
    #   end
    # end
  end

  # context "when user is employee" do
  #   before do
  #     create(:company_user, company_id: company.id, user_id: user.id)
  #     user.add_role :employee, company
  #     sign_in user
  #     send_request(:post, clients_path, params: {
  #       client: {
  #         name: "Test Client",
  #         email: "test@example.com",
  #         phone: "Test phone",
  #         address: "India",
  #       }
  #     })
  #   end

  #   it "will not be created" do
  #     expect(Client.count).to eq(0)
  #   end

  #   it "redirects to root_path" do
  #     expect(response).to have_http_status(:redirect)
  #   end

  #   it "is not permitted to create client" do
  #     expect(flash[:alert]).to eq("You are not authorized to create client.")
  #   end
  # end

  # context "when unauthenticated" do
  #   it "user will be redirects to sign in path" do
  #     send_request(:post, clients_path, params: {
  #       client: {
  #         name: "Test Client",
  #         email: "test@example.com",
  #         phone: "Test phone",
  #         address: "India",
  #       }
  #     })
  #     expect(response).to redirect_to(user_session_path)
  #     expect(flash[:alert]).to eq("You need to sign in or sign up before continuing.")
  #   end
  # end
end
