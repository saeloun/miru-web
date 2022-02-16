# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Companies#create", type: :request do
  let (:user) { create(:user) }

  context "when authenticated" do
    before do
      sign_in user
    end

    before(:each, :user_employee) do
      user.add_role :employee
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

      it "employee can't create company", user_employee: true do
        expect(response).to have_http_status(:redirect)
        expect(flash[:alert]).to eq("You are not authorized to perform this action.")
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

      it "creates a new company" do
        expect(response.body).to include("Company creation failed")
      end

      it "sets the company_id to current_user" do
        expect(Company.count).to eq(0)
      end

      it "redirects to root_path " do
        expect(response).to have_http_status(:unprocessable_entity)
      end

      it "employee can't create company", user_employee: true do
        expect(response).to have_http_status(:redirect)
        expect(flash[:alert]).to eq("You are not authorized to perform this action.")
      end
    end
  end
end
