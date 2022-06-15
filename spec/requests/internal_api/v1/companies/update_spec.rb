# frozen_string_literal: true

require "rails_helper"

RSpec.describe "InternalApi::V1::Companies::update", type: :request do
  let(:company) { create(:company) }
  let(:user) { create(:user, current_workspace_id: company.id) }

  context "when user is an admin" do
    before do
      create(:company_user, company:, user:)
      user.add_role :admin, company
      sign_in user
    end

    context "when company is valid" do
      before do
        send_request(
          :put, "#{internal_api_v1_companies_path}/#{company[:id]}", params: {
            company: {
              name: "Test Company",
              address: "test address",
              business_phone: "Test phone",
              country: "India",
              timezone: "IN",
              base_currency: "Rs",
              standard_price: "1000",
              fiscal_year_end: "April",
              date_format: "DD/MM/YYYY"
            }
          })
      end

      it "response should be successful" do
        expect(response).to be_successful
      end

      it "returns success json response" do
        expect(json_response["notice"]).to eq(I18n.t("companies.update.success"))
      end
    end

    context "when company is invalid" do
      before do
        send_request(
          :put, "#{internal_api_v1_companies_path}/#{company[:id]}", params: {
            company: {
              business_phone: "12345677",
              timezone: "",
              base_currency: "",
              standard_price: "",
              fiscal_year_end: "",
              date_format: ""
            }
          })
      end

      it "will fail" do
        expect(json_response["error"]).to eq("Standard price can't be blank")
      end

      it "will not be created" do
        change(Company, :count).by(0)
      end
    end
  end

  context "when user is a book keeper" do
    before do
      create(:company_user, company:, user:)
      user.add_role :book_keeper, company
      sign_in user
    end

    context "when company is valid" do
      before do
        send_request(
          :put, "#{internal_api_v1_companies_path}/#{company[:id]}", params: {
            company: {
              name: "Test Company",
              address: "test address",
              business_phone: "Test phone",
              country: "India",
              timezone: "IN",
              base_currency: "Rs",
              standard_price: "1000",
              fiscal_year_end: "April",
              date_format: "DD/MM/YYYY"
            }
          })
      end

      it "is not be permitted to update a company" do
        expect(response).to have_http_status(:forbidden)
      end
    end
  end
end
