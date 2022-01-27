# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Teams", type: :request do
  describe "GET /index" do
    it "returns http success" do
      get("/team")
      expect(response).to have_http_status(:found)
    end
  end
end
