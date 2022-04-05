# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Companies#create", type: :request do
  let(:company) { create(:company) }
  let(:user) { create(:user, current_workspace_id: company.id) }

  context "when user is admin" do
    before do
      create(:company_user, company_id: company.id, user_id: user.id)
      user.add_role :admin, company
      sign_in user
    end

    context "when company is valid" do
      before do
        send_request(
          :put, company_path, params: {
            company: {
              name: "Updated Company",
              address: "updated address",
              business_phone: "1234556"
            }
          })
      end

      it "updates the company" do
        company.reload
        expect(company.name).to eq("Updated Company")
        expect(company.address).to eq("updated address")
      end

      it "redirects to root_path" do
        expect(response).to have_http_status(:redirect)
      end
    end

    context "when company is invalid" do
      before do
        send_request(
          :put, company_path, params: {
            company: {
              name: "",
              address: "",
              business_phone: ""
            }
          })
      end

      it "shows error message with error status code" do
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
        send_request(
          :put, company_path, params: {
            company: {
              name: "Updated Company",
              address: "updated address",
              business_phone: "1234556"
            }
          })
      end

      it "redirects to root_path" do
        expect(response).to have_http_status(:redirect)
      end

      it "is not permitted to update a company" do
        expect(flash[:alert]).to eq("You are not authorized to update company.")
      end
    end

    context "when company is invalid" do
      before do
        send_request(
          :put, company_path, params: {
            company: {
              name: "",
              address: "",
              business_phone: ""
            }
          })
      end

      it "redirects to root_path" do
        expect(response).to have_http_status(:redirect)
      end

      it "is not permitted to update a company" do
        expect(flash[:alert]).to eq("You are not authorized to update company.")
      end
    end
  end

  context "when unauthenticated" do
    it "user will be redirects to sign in path" do
      send_request(
        :put, company_path, params: {
          company: {
            name: "Updated Company",
            address: "updated address",
            business_phone: "1234556"
          }
        })
      expect(response).to redirect_to(user_session_path)
      expect(flash[:alert]).to eq("You need to sign in or sign up before continuing.")
    end
  end
end
