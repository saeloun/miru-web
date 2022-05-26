# frozen_string_literal: true

require "rails_helper"

RSpec.describe "InternalApi::V1::Payments::Providers", type: :request do
  describe "GET /create" do
    it "returns http success" do
      get "/internal_api/v1/payments/providers/create"
      expect(response).to have_http_status(:success)
    end
  end

  describe "GET /index" do
    it "returns http success" do
      get "/internal_api/v1/payments/providers/index"
      expect(response).to have_http_status(:success)
    end
  end

  describe "GET /update" do
    it "returns http success" do
      get "/internal_api/v1/payments/providers/update"
      expect(response).to have_http_status(:success)
    end
  end
end
