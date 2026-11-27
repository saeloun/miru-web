# frozen_string_literal: true

require "rails_helper"
require "vips"

RSpec.describe "Companies logo", type: :request do
  describe "GET /companies/:id/logo" do
    it "temporarily redirects to a square company logo representation" do
      company = create(:company, :with_logo)

      get logo_company_path(company)

      expect(response).to have_http_status(:found)
      expect(response.headers["Location"]).to include("/rails/active_storage/representations/redirect/")
      expect(response.headers["Location"]).to include("test-image.png")

      follow_redirect!
      expect(response).to have_http_status(:found)
      follow_redirect!

      expect(response).to have_http_status(:ok)
      expect(response.media_type).to eq("image/png")
      image = Vips::Image.new_from_buffer(response.body, "")
      expect([image.width, image.height]).to eq([72, 72])
      expect(image.avg).to be_finite
    end

    it "returns not found when the company has no logo" do
      company = create(:company)

      get logo_company_path(company)

      expect(response).to have_http_status(:not_found)
    end
  end
end
