# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Companies logo", type: :request do
  describe "GET /companies/:id/logo" do
    it "temporarily redirects to a square company logo representation" do
      company = create(:company, :with_logo)

      get logo_company_path(company)

      expect(response).to have_http_status(:found)
      expect(response.headers["Location"]).to include("/rails/active_storage/representations/redirect/")
      expect(response.headers["Location"]).to include("test-image.png")
    end

    it "returns not found when the company has no logo" do
      company = create(:company)

      get logo_company_path(company)

      expect(response).to have_http_status(:not_found)
    end
  end
end
