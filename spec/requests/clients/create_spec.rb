# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Client#index", type: :request do
  let(:company) { create(:company) }
  let(:user) { create(:user, current_workspace_id: company.id) }

  context "when user is admin" do
    before do
      create(:company_user, company_id: company.id, user_id: user.id)
      user.add_role :admin, company
      sign_in user
      send_request :get, clients_path
    end

    context "when client is valid" do
      before do
        send_request(
          :post, clients_path, params: {
            client: {
              name: "Test Client",
              email: "test@example.com",
              phone: "Test phone",
              address: "India"
            }
          })
      end

      it "creates a new client" do
        expect(Client.count).to eq(1)
      end

      it "sets the company_id to current_user" do
        expect(user.current_workspace_id).to eq(Company.first.id)
      end

      it "redirects to root_path" do
        expect(response).to have_http_status(:redirect)
      end
    end

    context "when client is invalid" do
      before do
        send_request(
          :post, clients_path, params: {
            client: {
              name: "",
              email: "",
              phone: "",
              address: ""
            }
          })
      end

      it "will fail" do
        expect(response.body).to include("Client creation failed")
      end

      it "will not be created" do
        expect(Client.count).to eq(0)
      end

      it "redirects to root_path" do
        expect(response).to have_http_status(:unprocessable_entity)
      end
    end
  end

  context "when user is employee" do
    before do
      create(:company_user, company_id: company.id, user_id: user.id)
      user.add_role :employee, company
      sign_in user
      send_request(
        :post, clients_path, params: {
          client: {
            name: "Test Client",
            email: "test@example.com",
            phone: "Test phone",
            address: "India"
          }
        })
    end

    it "will not be created" do
      expect(Client.count).to eq(0)
    end

    it "redirects to root_path" do
      expect(response).to have_http_status(:redirect)
    end

    it "is not permitted to create client" do
      expect(flash[:alert]).to eq("You are not authorized to create client.")
    end
  end

  context "when unauthenticated" do
    it "user will be redirects to sign in path" do
      send_request(
        :post, clients_path, params: {
          client: {
            name: "Test Client",
            email: "test@example.com",
            phone: "Test phone",
            address: "India"
          }
        })
      expect(response).to redirect_to(user_session_path)
      expect(flash[:alert]).to eq("You need to sign in or sign up before continuing.")
    end
  end
end
