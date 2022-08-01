# frozen_string_literal: true

require "rails_helper"

RSpec.describe "InternalApi::V1::Companies::create", type: :request do
  let(:user1) { create(:user) }

  context "when user is an admin" do
    before do
      sign_in user1
    end

    context "when company is valid" do
      before do
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

    context "when company is invalid" do
      before do
        send_request :post, internal_api_v1_companies_path, params: {
          company: {
            business_phone: "12345677",
            timezone: "",
            base_currency: "",
            standard_price: "",
            fiscal_year_end: "",
            date_format: ""
          }
        }
      end

      it "will fail" do
        expect(json_response["error"]).to eq("Name can't be blank")
      end

      it "will not be created" do
        expect(Company.count).to eq(0)
      end
    end

    context "when the user is a book keeper" do
      before do
        user1.add_role :book_keeper
        sign_in user1
      end

      context "when company is valid" do
        before do
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

      context "when company is invalid" do
        before do
          send_request :post, internal_api_v1_companies_path, params: {
            company: {
              business_phone: "12345677",
              timezone: "",
              base_currency: "",
              standard_price: "",
              fiscal_year_end: "",
              date_format: ""
            }
          }
        end

        it "will fail" do
          expect(json_response["error"]).to eq("Name can't be blank")
        end

        it "will not be created" do
          expect(Company.count).to eq(0)
        end
      end
    end
  end
end
