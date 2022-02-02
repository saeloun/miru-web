# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Projects", type: :request do
  describe "GET /index" do
    it "returns http success" do
      get("/projects")
      expect(response).to have_http_status(:found)
    end
  end
end
