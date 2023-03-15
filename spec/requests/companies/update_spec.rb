# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Companies#create", type: :request do
  let(:company) { create(:company) }
  let(:user) { create(:user, current_workspace_id: company.id) }
  let(:address) { attributes_for(:address) }

  context "when user is an admin" do
    before do
      create(:employment, company:, user:)
      user.add_role :admin, company
      sign_in user
    end

    context "when company is valid" do
      before do
        send_request(
          :put, company_path, params: {
            company: {
              name: "Updated Company",
              business_phone: "1234556",
              addresses_attributes: [ address.merge({ id: company.current_address.id }) ]
            }
          })
      end

      it "updates the company and address" do
        company.reload
        current_address = company.current_address
        expect(company.name).to eq("Updated Company")
        expect(current_address.address_line_1).to eq(address[:address_line_1])
        expect(current_address.address_line_2).to eq(address[:address_line_2])
        expect(current_address.city).to eq(address[:city])
        expect(current_address.pin).to eq(address[:pin])
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
              business_phone: ""
            }
          })
      end

      it "shows error message with error status code" do
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
          :put, company_path, params: {
            company: {
              name: "Updated Company",
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

  context "when user is a book keeper" do
    before do
      create(:employment, company:, user:)
      user.add_role :book_keeper, company
      sign_in user
    end

    context "when company is valid" do
      before do
        send_request(
          :put, company_path, params: {
            company: {
              name: "Updated Company",
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
            business_phone: "1234556"
          }
        })
      expect(response).to redirect_to(user_session_path)
      expect(flash[:alert]).to eq("You need to sign in or sign up before continuing.")
    end
  end
end
