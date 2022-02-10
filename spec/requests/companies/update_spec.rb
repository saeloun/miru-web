# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Companies#create", type: :request do
  let (:company) { create(:company) }
  let (:user) { create(:user, company_id: company.id) }

  context "when authenticated" do
    before do
      sign_in user
    end

    context "when company is valid" do
      before do
        send_request(:put, company_path, params: {
          company: {
            name: "Updated Company",
            address: "updated address",
            business_phone: "1234556",
          }
        })
      end

      it "updates the company" do
        company.reload
        expect(company.name).to eq("Updated Company")
        expect(company.address).to eq("updated address")
      end

      it "redirects to root_path " do
        expect(response).to have_http_status(:redirect)
      end
    end
    context "when company is invalid" do
      before do
        send_request(:put, company_path, params: {
          company: {
            name: "",
            address: "",
            business_phone: "",
          }
        })
      end

      it "shows error message with error status code" do
        expect(response).to have_http_status(:unprocessable_entity)
      end
    end
  end
end
