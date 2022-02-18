# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Companies#create", type: :request do
  let (:user) { create(:user) }

  context "when user is admin" do
    before do
      user.add_role :admin
      sign_in user
    end

    context "when company is valid" do
      before do
        send_request(:post, company_path, params: {
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

      it "creates a new company" do
        expect(Company.count).to eq(1)
      end

      it "sets the company_id to current_user" do
        expect(user.company_id).to eq(Company.first.id)
      end

      it "redirects to root_path " do
        expect(response).to have_http_status(:redirect)
      end
    end

    context "when company is invalid" do
      before do
        send_request(:post, company_path, params: {
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

      it "company creation will fail" do
        expect(response.body).to include("Company creation failed")
      end

      it "company record won't be created" do
        expect(Company.count).to eq(0)
      end

      it "redirects to root_path " do
        expect(response).to have_http_status(:unprocessable_entity)
      end
    end
  end

  context "When user is employee" do
    before do
      user.add_role :employee
      sign_in user
    end

    context "when company is valid" do
      before do
        send_request(:post, company_path, params: {
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

      it "company won't be created" do
        expect(Company.count).to eq(0)
      end

      it "redirects to root_path" do
        expect(response).to have_http_status(:redirect)
      end

      it "is not permitted to create company" do
        expect(flash[:alert]).to eq("You are not authorized to create company.")
      end
    end

    context "when company is invalid" do
      before do
        send_request(:post, company_path, params: {
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
      it "company won't be created" do
        expect(Company.count).to eq(0)
      end

      it "redirects to root_path" do
        expect(response).to have_http_status(:redirect)
      end

      it "is not permitted to craete company" do
        expect(flash[:alert]).to eq("You are not authorized to create company.")
      end
    end
  end

  context "when unauthenticated" do
    it "user will be redirects to sign in path" do
      send_request(:post, company_path, params: {
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
      expect(response).to redirect_to(user_session_path)
      expect(flash[:alert]).to eq("You need to sign in or sign up before continuing.")
    end
  end
end
