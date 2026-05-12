# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Api::V1::Companies::update", type: :request do
  let(:company) { create(:company) }
  let(:user) { create(:user, current_workspace_id: company.id) }

  context "when user is an admin" do
    before do
      create(:employment, company:, user:)
      user.add_role :admin, company
      sign_in user
    end

    context "when company is valid" do
      before do
        send_request(
          :put, "#{api_v1_companies_path}/#{company[:id]}", params: {
            company: {
              name: "Test Company",
              business_phone: "Test phone",
              country: "India",
              timezone: "IN",
              base_currency: "Rs",
              standard_price: "1000",
              fiscal_year_end: "April",
              date_format: "DD/MM/YYYY",
              bank_name: "First Bank",
              bank_account_number: "123456789",
              bank_routing_number: "987654321",
              bank_swift_code: "FSTBUS33",
              tax_id: "TAX-123",
              vat_number: "VAT-456",
              gst_number: "GST-789",
              ein: "12-3456789",
              us_taxpayer_id: "987-65-4321",
              addresses_attributes: [{
                id: company.current_address.id,
                address_line_1: "updated address"
              }],
              working_days: "5",
              working_hours: "40"
            }
          }, headers: auth_headers(user))
      end

      it "response should be successful" do
        expect(response).to be_successful
      end

      it "returns success json response" do
        expect(json_response["notice"]).to eq(I18n.t("companies.update.success"))
      end

      it "updates the company" do
        company.reload
        company.current_address.reload
        expect(company.name).to eq("Test Company")
        expect(company.business_phone).to eq("Test phone")
        expect(company.standard_price).to eq(1000)
        expect(company.fiscal_year_end).to eq("April")
        expect(company.base_currency).to eq("Rs")
        expect(company.working_days).to eq("5")
        expect(company.working_hours).to eq("40")
        expect(company.bank_name).to eq("First Bank")
        expect(company.bank_account_number).to eq("123456789")
        expect(company.bank_routing_number).to eq("987654321")
        expect(company.bank_swift_code).to eq("FSTBUS33")
        expect(company.tax_id).to eq("TAX-123")
        expect(company.vat_number).to eq("VAT-456")
        expect(company.gst_number).to eq("GST-789")
        expect(company.ein).to eq("12-3456789")
        expect(company.us_taxpayer_id).to eq("987-65-4321")
        expect(company.current_address.address_line_1).to eq("updated address")
      end
    end

    context "when company is invalid" do
      before do
        send_request(
          :put, "#{api_v1_companies_path}/#{company[:id]}", params: {
            company: {
              business_phone: "12345677",
              timezone: "",
              base_currency: "",
              standard_price: "",
              fiscal_year_end: "",
              date_format: ""
            }
          }, headers: auth_headers(user))
      end

      it "will fail" do
        expect(json_response["errors"]).to eq("Standard price can't be blank")
      end

      it "will not be created" do
        change(Company, :count).by(0)
      end
    end

    context "when address is invalid" do
      before do
        send_request(
          :put, "#{api_v1_companies_path}/#{company[:id]}", params: {
            company: {
              business_phone: "12345677",
              timezone: "IN",
              base_currency: "Rs",
              standard_price: "1000",
              fiscal_year_end: "April",
              date_format: "",
              addresses_attributes: [{
                id: company.current_address.id,
                address_line_1: ""
              }],
              working_days: "5",
              working_hours: "40"
            }
          }, headers: auth_headers(user))
      end

      it "will fail" do
        expect(json_response["errors"]).to eq("Addresses address line 1 can't be blank")
      end
    end

    context "when business phone validation" do
      context "with valid US phone number" do
        before do
          send_request(
            :put, "#{api_v1_companies_path}/#{company[:id]}", params: {
              company: {
                business_phone: "+14155552671",
                timezone: "IN",
                base_currency: "Rs",
                standard_price: "1000",
                fiscal_year_end: "April",
                date_format: "DD/MM/YYYY",
                working_days: "5",
                working_hours: "40"
              }
            }, headers: auth_headers(user))
        end

        it "response should be successful" do
          expect(response).to be_successful
        end

        it "updates the business phone" do
          expect(company.reload.business_phone).to eq("+14155552671")
        end
      end

      context "with valid Indian phone number" do
        before do
          send_request(
            :put, "#{api_v1_companies_path}/#{company[:id]}", params: {
              company: {
                business_phone: "+919876543210",
                timezone: "IN",
                base_currency: "Rs",
                standard_price: "1000",
                fiscal_year_end: "April",
                date_format: "DD/MM/YYYY",
                working_days: "5",
                working_hours: "40"
              }
            }, headers: auth_headers(user))
        end

        it "response should be successful" do
          expect(response).to be_successful
        end

        it "updates the business phone" do
          expect(company.reload.business_phone).to eq("+919876543210")
        end
      end

      context "with valid UK phone number" do
        before do
          send_request(
            :put, "#{api_v1_companies_path}/#{company[:id]}", params: {
              company: {
                business_phone: "+442071234567",
                timezone: "IN",
                base_currency: "Rs",
                standard_price: "1000",
                fiscal_year_end: "April",
                date_format: "DD/MM/YYYY",
                working_days: "5",
                working_hours: "40"
              }
            }, headers: auth_headers(user))
        end

        it "response should be successful" do
          expect(response).to be_successful
        end

        it "updates the business phone" do
          expect(company.reload.business_phone).to eq("+442071234567")
        end
      end

      context "with blank phone number" do
        before do
          send_request(
            :put, "#{api_v1_companies_path}/#{company[:id]}", params: {
              company: {
                business_phone: "",
                timezone: "IN",
                base_currency: "Rs",
                standard_price: "1000",
                fiscal_year_end: "April",
                date_format: "DD/MM/YYYY",
                working_days: "5",
                working_hours: "40"
              }
            }, headers: auth_headers(user))
        end

        it "response should be successful" do
          expect(response).to be_successful
        end

        it "allows blank phone number" do
          expect(company.reload.business_phone).to eq("")
        end
      end

      context "with invalid phone number" do
        before do
          send_request(
            :put, "#{api_v1_companies_path}/#{company[:id]}", params: {
              company: {
                business_phone: "123",
                timezone: "IN",
                base_currency: "Rs",
                standard_price: "1000",
                fiscal_year_end: "April",
                date_format: "DD/MM/YYYY",
                working_days: "5",
                working_hours: "40"
              }
            }, headers: auth_headers(user))
        end

        it "returns error response" do
          expect(response).to have_http_status(:unprocessable_entity)
        end

        it "returns validation error" do
          expect(json_response["errors"]).to include("Business phone is invalid")
        end

        it "does not update the phone number" do
          original_phone = company.business_phone
          company.reload
          expect(company.business_phone).to eq(original_phone)
        end
      end

      context "with phone number exceeding 15 characters" do
        before do
          send_request(
            :put, "#{api_v1_companies_path}/#{company[:id]}", params: {
              company: {
                business_phone: "+1234567890123456",
                timezone: "IN",
                base_currency: "Rs",
                standard_price: "1000",
                fiscal_year_end: "April",
                date_format: "DD/MM/YYYY",
                working_days: "5",
                working_hours: "40"
              }
            }, headers: auth_headers(user))
        end

        it "returns error response" do
          expect(response).to have_http_status(:unprocessable_entity)
        end

        it "returns validation error" do
          expect(json_response["errors"]).to include("Business phone is invalid")
        end

        it "does not update the phone number" do
          original_phone = company.business_phone
          company.reload
          expect(company.business_phone).to eq(original_phone)
        end
      end

      context "with valid Australian phone number" do
        before do
          send_request(
            :put, "#{api_v1_companies_path}/#{company[:id]}", params: {
              company: {
                business_phone: "+61291234567",
                timezone: "IN",
                base_currency: "Rs",
                standard_price: "1000",
                fiscal_year_end: "April",
                date_format: "DD/MM/YYYY",
                working_days: "5",
                working_hours: "40"
              }
            }, headers: auth_headers(user))
        end

        it "response should be successful" do
          expect(response).to be_successful
        end

        it "updates the business phone" do
          expect(company.reload.business_phone).to eq("+61291234567")
        end
      end

      context "with valid French phone number" do
        before do
          send_request(
            :put, "#{api_v1_companies_path}/#{company[:id]}", params: {
              company: {
                business_phone: "+33123456789",
                timezone: "IN",
                base_currency: "Rs",
                standard_price: "1000",
                fiscal_year_end: "April",
                date_format: "DD/MM/YYYY",
                working_days: "5",
                working_hours: "40"
              }
            }, headers: auth_headers(user))
        end

        it "response should be successful" do
          expect(response).to be_successful
        end

        it "updates the business phone" do
          expect(company.reload.business_phone).to eq("+33123456789")
        end
      end
    end
  end

  context "when user is a book keeper" do
    before do
      create(:employment, company:, user:)
      user.add_role :book_keeper, company
      sign_in user
    end

    context "when company is valid" do
      before do
        send_request(
          :put, "#{api_v1_companies_path}/#{company[:id]}", params: {
            company: {
              name: "Test Company",
              business_phone: "Test phone",
              country: "India",
              timezone: "IN",
              base_currency: "Rs",
              standard_price: "1000",
              fiscal_year_end: "April",
              date_format: "DD/MM/YYYY",
              addresses_attributes: [{
                id: company.current_address.id,
                address_line_2: "updated address"
              }],
              working_days: "5",
              working_hours: "40"
            }
          }, headers: auth_headers(user))
      end

      it "is not be permitted to update a company" do
        expect(response).to have_http_status(:forbidden)
      end
    end
  end
end
