# frozen_string_literal: true

require "rails_helper"

RSpec.describe "InternalApi::V1::Companies::create", type: :request do
  let(:user) { create(:user) }
  let(:address) { attributes_for(:address) }

  context "when user is an admin" do
    before do
      sign_in user
    end

    context "when company is valid" do
      before do
        send_request :post, internal_api_v1_companies_path, params: {
          company: {
            name: "zero labs llc",
            business_phone: "+01 123123",
            country: "india",
            timezone: "+5:30 Chennai",
            base_currency: "INR",
            standard_price: 1000,
            fiscal_year_end: "Jan-Dec",
            date_format: "DD-MM-YYYY",
            addresses_attributes: [address],
            working_days: "5",
            working_hours: "40"
          }
        }, headers: auth_headers(user)
      end

      it "creates a new compamy & address" do
        company = Company.last
        company_address = company.current_address
        change(Company, :count).by(1)
        change(Address, :count).by(1)
        expect(company.name).to eq("zero labs llc")
        expect(company.business_phone).to eq("+01 123123")
        expect(company.base_currency).to eq("INR")
        expect(company.standard_price).to eq(1000)
        expect(company.date_format).to eq("DD-MM-YYYY")
        expect(company_address.address_line_1).to eq(address[:address_line_1])
        expect(company_address.city).to eq(address[:city])
        expect(company_address.pin).to eq(address[:pin])
      end

      it "returns correct working_days and working_hours" do
        company = Company.last
        change(Company, :count).by(1)
        expect(company.working_days).to eq("5")
        expect(company.working_hours).to eq("40")
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
        }, headers: auth_headers(user)
      end

      it "will fail" do
        expect(json_response["errors"]).to eq("Name can't be blank")
      end

      it "will not be created" do
        expect(Company.count).to eq(1)
      end
    end

    context "when the user is a book keeper" do
      before do
        user.add_role :book_keeper
        sign_in user
      end

      context "when company is valid" do
        before do
          send_request :post, internal_api_v1_companies_path, params: {
            company: {
              name: "zero labs llc",
              business_phone: "+01 123123",
              country: "india",
              timezone: "+5:30 Chennai",
              base_currency: "INR",
              standard_price: 1000,
              fiscal_year_end: "Jan-Dec",
              date_format: "DD-MM-YYYY",
              addresses_attributes: [address],
              working_days: "5",
              working_hours: "40"
            }
          }, headers: auth_headers(user)
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
          }, headers: auth_headers(user)
        end

        it "will fail" do
          expect(json_response["errors"]).to eq("Name can't be blank")
        end

        it "will not be created" do
          expect(Company.count).to eq(1)
        end
      end
    end
  end
end
