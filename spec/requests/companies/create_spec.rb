# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Companies#create", type: :request do
  let (:company) { create(:company) }
  let (:user) { create(:user, current_workspace_id: company.id) }

  context "when user is admin" do
    before do
      create(:company_user, company_id: company.id, user_id: user.id)
      user.add_role :admin, company
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
        expect(Company.count).to eq(2)
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

      it "will fail" do
        expect(response.body).to include("Company creation failed")
      end

      it "will not be created" do
        expect(Company.count).to eq(1)
      end

      it "redirects to root_path" do
        expect(response).to have_http_status(:unprocessable_entity)
      end
    end
  end

  context "when user is employee" do
    before do
      create(:company_user, company_id: company.id, user_id: user.id)
      user.add_role :employee, company
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

      it "will be created" do
        expect(Company.count).to eq(2)
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

      it "will not be created" do
        expect(Company.count).to eq(1)
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
