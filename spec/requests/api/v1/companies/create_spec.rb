# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Api::V1::Companies::create", type: :request do
  let(:user) { create(:user) }
  let(:address) { attributes_for(:address) }

  context "when user is an admin" do
    before do
      sign_in user
    end

    context "when company is valid" do
      before do
        send_request :post, api_v1_companies_path, params: {
          company: {
            name: "zero labs llc",
            business_phone: "+919876543210",
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
        expect(company.business_phone).to eq("+919876543210")
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
      let(:invalid_params) do
        {
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

      before do
        send_request :post, api_v1_companies_path, params: invalid_params, headers: auth_headers(user)
      end

      it "will fail" do
        expect(json_response["errors"]).to include("Name can't be blank")
      end

      it "will not be created" do
        expect {
          send_request :post, api_v1_companies_path, params: invalid_params, headers: auth_headers(user)
        }.not_to change(Company, :count)
      end
    end

    context "when business phone validation" do
      context "with valid US phone number" do
        before do
          send_request :post, api_v1_companies_path, params: {
            company: {
              name: "Test Company",
              business_phone: "+14155552671",
              country: "US",
              timezone: "America/New_York",
              base_currency: "USD",
              standard_price: 1000,
              fiscal_year_end: "Jan-Dec",
              date_format: "DD-MM-YYYY",
              addresses_attributes: [address],
              working_days: "5",
              working_hours: "40"
            }
          }, headers: auth_headers(user)
        end

        it "creates company successfully" do
          expect(response).to be_successful
        end

        it "saves the phone number correctly" do
          expect(Company.last.business_phone).to eq("+14155552671")
        end
      end

      context "with valid Indian phone number" do
        before do
          send_request :post, api_v1_companies_path, params: {
            company: {
              name: "Test Company",
              business_phone: "+919876543210",
              country: "India",
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

        it "creates company successfully" do
          expect(response).to be_successful
        end

        it "saves the phone number correctly" do
          expect(Company.last.business_phone).to eq("+919876543210")
        end
      end

      context "with valid UK phone number" do
        before do
          send_request :post, api_v1_companies_path, params: {
            company: {
              name: "Test Company",
              business_phone: "+442071234567",
              country: "UK",
              timezone: "Europe/London",
              base_currency: "GBP",
              standard_price: 1000,
              fiscal_year_end: "Jan-Dec",
              date_format: "DD-MM-YYYY",
              addresses_attributes: [address],
              working_days: "5",
              working_hours: "40"
            }
          }, headers: auth_headers(user)
        end

        it "creates company successfully" do
          expect(response).to be_successful
        end

        it "saves the phone number correctly" do
          expect(Company.last.business_phone).to eq("+442071234567")
        end
      end

      context "with blank phone number" do
        before do
          send_request :post, api_v1_companies_path, params: {
            company: {
              name: "Test Company",
              business_phone: "",
              country: "US",
              timezone: "America/New_York",
              base_currency: "USD",
              standard_price: 1000,
              fiscal_year_end: "Jan-Dec",
              date_format: "DD-MM-YYYY",
              addresses_attributes: [address],
              working_days: "5",
              working_hours: "40"
            }
          }, headers: auth_headers(user)
        end

        it "creates company successfully" do
          expect(response).to be_successful
        end

        it "allows blank phone number" do
          expect(Company.last.business_phone).to eq("")
        end
      end

      context "with invalid phone number" do
        before do
          send_request :post, api_v1_companies_path, params: {
            company: {
              name: "Test Company",
              business_phone: "123",
              country: "US",
              timezone: "America/New_York",
              base_currency: "USD",
              standard_price: 1000,
              fiscal_year_end: "Jan-Dec",
              date_format: "DD-MM-YYYY",
              addresses_attributes: [address],
              working_days: "5",
              working_hours: "40"
            }
          }, headers: auth_headers(user)
        end

        it "returns error response" do
          expect(response).to have_http_status(:unprocessable_entity)
        end

        it "returns validation error" do
          expect(json_response["errors"]).to include("Business phone is invalid")
        end

        it "does not create the company" do
          expect {
            send_request :post, api_v1_companies_path, params: {
              company: {
                name: "Test Company",
                business_phone: "123",
                country: "US",
                timezone: "America/New_York",
                base_currency: "USD",
                standard_price: 1000,
                fiscal_year_end: "Jan-Dec",
                date_format: "DD-MM-YYYY",
                addresses_attributes: [address],
                working_days: "5",
                working_hours: "40"
              }
            }, headers: auth_headers(user)
          }.not_to change(Company, :count)
        end
      end

      context "with phone number exceeding 15 characters" do
        before do
          send_request :post, api_v1_companies_path, params: {
            company: {
              name: "Test Company",
              business_phone: "+1234567890123456",
              country: "US",
              timezone: "America/New_York",
              base_currency: "USD",
              standard_price: 1000,
              fiscal_year_end: "Jan-Dec",
              date_format: "DD-MM-YYYY",
              addresses_attributes: [address],
              working_days: "5",
              working_hours: "40"
            }
          }, headers: auth_headers(user)
        end

        it "returns error response" do
          expect(response).to have_http_status(:unprocessable_entity)
        end

        it "returns validation error" do
          expect(json_response["errors"]).to include("Business phone is invalid")
        end

        it "does not create the company" do
          expect {
            send_request :post, api_v1_companies_path, params: {
              company: {
                name: "Test Company",
                business_phone: "+1234567890123456",
                country: "US",
                timezone: "America/New_York",
                base_currency: "USD",
                standard_price: 1000,
                fiscal_year_end: "Jan-Dec",
                date_format: "DD-MM-YYYY",
                addresses_attributes: [address],
                working_days: "5",
                working_hours: "40"
              }
            }, headers: auth_headers(user)
          }.not_to change(Company, :count)
        end
      end
    end

    context "when the user is a book keeper" do
      before do
        user.add_role :book_keeper
        sign_in user
      end

      context "when company is valid" do
        before do
          send_request :post, api_v1_companies_path, params: {
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
        let(:invalid_params) do
          {
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

        before do
          send_request :post, api_v1_companies_path, params: invalid_params, headers: auth_headers(user)
        end

        it "will fail" do
          expect(json_response["errors"]).to include("Name can't be blank")
        end

        it "will not be created" do
          expect {
            send_request :post, api_v1_companies_path, params: invalid_params, headers: auth_headers(user)
          }.not_to change(Company, :count)
        end
      end
    end
  end
end
