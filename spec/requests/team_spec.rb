# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Teams", type: :request do
  describe "GET /index" do
    it "returns http success" do
      get "/team/index"
      expect(response).to have_http_status(:success)
    end
  end
end
