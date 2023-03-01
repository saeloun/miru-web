# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Companies#create", type: :request do
  let(:company) { create(:company, address_attributes: attributes_for(:address)) }
  let(:user) { create(:user, current_workspace_id: company.id) }
  let(:address) {
                  {
                    address_line_1: "Saeloun Inc", address_line_2: "475 Clermont Ave",
                    state: "NY", city: "Brooklyn", country: "US", pin: "12238"
                  }
                }

  context "when user is an admin" do
    before do
      create(:employment, company:, user:)
      user.add_role :admin, company
      sign_in user
    end

    context "when company is valid" do
      before do
        send_request(
          :post, company_path, params: {
            company: {
              name: "Test Company",
              business_phone: "Test phone",
              country: "India",
              timezone: "IN",
              base_currency: "Rs",
              standard_price: "1000",
              fiscal_year_end: "April",
              date_format: "DD/MM/YYYY",
              address_attributes: address
            }
          }, headers: auth_headers(user))
      end

      it "creates a new company" do
        company = Company.last
        company_address = company.address
        change(Company, :count).by(1)
        change(Address, :count).by(1)
        expect(company.name).to eq("Test Company")
        expect(company.standard_price).to eq(1000)
        expect(company.fiscal_year_end).to eq("April")
        expect(company.date_format).to eq("DD/MM/YYYY")
        expect(company_address.address_line_1).to eq("Saeloun Inc")
        expect(company_address.city).to eq("Brooklyn")
        expect(company_address.country).to eq("US")
        expect(company_address.pin).to eq("12238")
      end

      it "sets the current_workspace_id to current_user" do
        expect(user.current_workspace_id).to eq(Company.last.id)
      end

      it "redirects to root_path" do
        expect(response).to have_http_status(:redirect)
      end
    end

    context "when company is invalid" do
    before do
        send_request(
          :post, company_path, params: {
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
      expect(response.body).to include("Company creation failed")
    end

    it "will not be created" do
      change(Company, :count).by(0)
    end

    it "redirects to root_path" do
      expect(response).to have_http_status(:unprocessable_entity)
    end
  end
  end

  context "when user is an employee" do
    before do
      create(:employment, company:, user:)
      user.add_role :employee, company
      sign_in user
    end

    context "when company is valid" do
      before do
        send_request(
          :post, company_path, params: {
            company: {
              name: "Test Company",
              business_phone: "Test phone",
              country: "India",
              timezone: "IN",
              base_currency: "Rs",
              standard_price: "1000",
              fiscal_year_end: "April",
              date_format: "DD/MM/YYYY",
              address_attributes: attributes_for(:address)
            }
          }, headers: auth_headers(user))
      end

      it "will be created" do
        company = Company.last
        change(Company, :count).by(1)
        change(Address, :count).by(1)
        expect(company.name).to eq("Test Company")
        expect(company.business_phone).to eq("Test phone")
        expect(company.base_currency).to eq("Rs")
        expect(company.timezone).to eq("IN")
        expect(company.standard_price).to eq(1000)
        expect(company.fiscal_year_end).to eq("April")
        expect(company.date_format).to eq("DD/MM/YYYY")
      end

      it "sets the current_workspace_id to current_user" do
        expect(user.current_workspace_id).to eq(Company.last.id)
      end

      it "redirects to root_path" do
        expect(response).to have_http_status(:redirect)
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
            :post, company_path, params: {
              company: {
                name: "Test Company",
                business_phone: "Test phone",
                country: "India",
                timezone: "IN",
                base_currency: "Rs",
                standard_price: "1000",
                fiscal_year_end: "April",
                date_format: "DD/MM/YYYY",
                address_attributes: attributes_for(:address)
              }
            }, headers: auth_headers(user))
        end

        it "will be created" do
          company = Company.last
          change(Company, :count).by(1)
          expect(company.name).to eq("Test Company")
          expect(company.business_phone).to eq("Test phone")
          expect(company.timezone).to eq("IN")
          expect(company.standard_price).to eq(1000)
          expect(company.fiscal_year_end).to eq("April")
          expect(company.date_format).to eq("DD/MM/YYYY")
        end

        it "sets the current_workspace_id to current_user" do
          expect(user.current_workspace_id).to eq(Company.last.id)
        end

        it "redirects to root_path" do
          expect(response).to have_http_status(:redirect)
        end
      end
    end

    context "when company is invalid" do
      before do
        send_request(
          :post, company_path, params: {
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

      it "will not be created" do
        change(Company, :count).by(0)
      end

      it "will fail" do
        expect(response.body).to include("Company creation failed")
      end

      it "redirects to root_path" do
        expect(response).to have_http_status(:unprocessable_entity)
      end
    end
  end

  context "when unauthenticated" do
    it "user will be redirects to sign in path" do
      send_request(
        :post, company_path, params: {
          company: {
            name: "Test Company",
            business_phone: "Test phone",
            country: "India",
            timezone: "IN",
            base_currency: "Rs",
            standard_price: "1000",
            fiscal_year_end: "April",
            date_format: "DD/MM/YYYY",
            address_attributes: attributes_for(:address)
          }
        })
      expect(response).to redirect_to(user_session_path)
      expect(flash[:alert]).to eq(I18n.t("devise.failure.unauthenticated"))
    end
  end
end
