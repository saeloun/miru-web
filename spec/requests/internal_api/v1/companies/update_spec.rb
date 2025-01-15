# frozen_string_literal: true

require "rails_helper"

RSpec.describe "InternalApi::V1::Companies::update", type: :request do
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
          :put, "#{internal_api_v1_companies_path}/#{company[:id]}", params: {
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
        expect(company.current_address.address_line_1).to eq("updated address")
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
          }, headers: auth_headers(user))
      end

      it "fails" do
        expect(json_response["errors"]).to eq("Standard price can't be blank")
      end

      it "does not be created" do
        change(Company, :count).by(0)
      end
    end

    context "when address is invalid" do
      before do
        send_request(
          :put, "#{internal_api_v1_companies_path}/#{company[:id]}", params: {
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

      it "fails" do
        expect(json_response["errors"]).to eq("Addresses address line 1 can't be blank")
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
          :put, "#{internal_api_v1_companies_path}/#{company[:id]}", params: {
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
