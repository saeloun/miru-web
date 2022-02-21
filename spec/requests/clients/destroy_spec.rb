# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Client#destroy", type: :request do
  let (:company) { create(:company) }
  let (:user) { create(:user, company_id: company.id) }
  let (:client) { create(:client, { id: 1, company_id: company.id }) }

  context "When user is admin" do
    before do
      user.add_role :admin
      sign_in user
    end

    context "when client exists" do
      before do
        send_request(:delete, "/internal_api/v1/clients/#{client.id}")
      end

      it "should delete the client" do
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

      it "should respond with client not found error" do
        expect(response).to have_http_status(:not_found)
        expect(JSON.parse(response.body, { object_class: OpenStruct }).errors)
          .to eq("Couldn't find Client with 'id'=#{client_id}")
      end
    end
  end

  context "When user is employee" do
    before do
      user.add_role :employee
      sign_in user
      send_request(:delete, "/internal_api/v1/clients/#{client.id}")
    end

    it "should not be permitted to delete client" do
      expect(JSON.parse(response.body, { object_class: OpenStruct }).message)
        .to eq(I18n.t("errors.unauthorized"))
    end
  end

  context "when unauthenticated" do
    it "should not be permitted to delete client" do
      send_request(:delete, "/internal_api/v1/clients/#{client.id}")
      expect(response).to have_http_status(:unauthorized)
      expect(JSON.parse(response.body, { object_class: OpenStruct }).error)
        .to eq("You need to sign in or sign up before continuing.")
    end
  end
end
