# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Client#destroy", type: :request do
  let(:company) { create(:company) }
  let(:user) { create(:user, current_workspace_id: company.id) }
  let(:client) { create(:client, { id: 1, company: }) }

  context "when user is admin" do
    before do
      create(:company_user, company:, user:)
      user.add_role :admin, company
      sign_in user
    end

    context "when client exists" do
      before do
        send_request(:delete, "/internal_api/v1/clients/#{client.id}")
      end

      it "deletes the client" do
        expect(response).to have_http_status(:ok)
        expect(JSON.parse(response.body, { object_class: OpenStruct }).notice)
          .to eq(I18n.t("client.delete.success.message"))
      end
    end

    context "when client doesn't exist" do
      client_id = rand(2...1000)

      before do
        send_request(:delete, "/internal_api/v1/clients/#{client_id}")
      end

      it "responds with client not found error" do
        expect(response).to have_http_status(:not_found)
        expect(JSON.parse(response.body, { object_class: OpenStruct }).errors)
          .to include("Couldn't find Client with 'id'=#{client_id}")
      end
    end
  end

  context "when user is employee" do
    before do
      create(:company_user, company:, user:)
      user.add_role :employee, company
      sign_in user
      send_request(:delete, "/internal_api/v1/clients/#{client.id}")
    end

    it "is not permitted to delete client" do
      expect(response).to have_http_status(:forbidden)
      expect(JSON.parse(response.body, { object_class: OpenStruct }).errors)
        .to eq(I18n.t("pundit.default"))
    end
  end

  context "when unauthenticated" do
    it "is not permitted to delete client" do
      send_request(:delete, "/internal_api/v1/clients/#{client.id}")
      expect(response).to have_http_status(:unauthorized)
      expect(JSON.parse(response.body, { object_class: OpenStruct }).error)
        .to eq("You need to sign in or sign up before continuing.")
    end
  end
end
