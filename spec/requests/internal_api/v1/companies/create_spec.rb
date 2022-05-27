# frozen_string_literal: true

require "rails_helper"

RSpec.describe "InternalApi::V1::Companies::create", type: :request do
  let(:user1) { create(:user) }

  context "when user is admin" do
    before do
      sign_in user1
      send_request :post, internal_api_v1_companies_path, params: {
        company: {
          name: "zero labs llc",
          address: "remote",
          business_phone: "+01 123123",
          country: "india",
          timezone: "+5:30 Chennai",
          base_currency: "INR",
          standard_price: 1000,
          fiscal_year_end: "Jan-Dec",
          date_format: "DD-MM-YYYY"
        }
      }
    end

    it "response should be successful" do
      expect(response).to be_successful
    end

    it "returns success json response" do
      expect(json_response["notice"]).to eq(I18n.t("companies.create.success"))
    end
  end
end
