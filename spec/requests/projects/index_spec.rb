# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Projects#index", type: :request do
  context "When authenticated" do
    it "returns http success" do
      get("/projects")
      expect(response).to have_http_status(:found)
    end
  end
end
