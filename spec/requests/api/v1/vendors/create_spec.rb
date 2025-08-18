# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Api::V1::Vendors#create", type: :request do
  let(:company) { create(:company) }
  let(:user) { create(:user, current_workspace_id: company.id) }

  context "when user is an admin" do
    before do
      create(:employment, company:, user:)
      user.add_role :admin, company
      sign_in user
    end

    context "when creates the vendor" do
      before do
        @vendor = attributes_for(:vendor, company:)
        send_request :post, api_v1_vendors_path(vendor: @vendor), headers: auth_headers(user)
      end

      it "return the success" do
        expect(response).to have_http_status(:ok)
      end

      it "adds the vendor entry to the database" do
        vendor = Vendor.last
        expect(vendor.name).to eq(@vendor[:name])
        expect(vendor.company_id).to eq(company.id)
      end

      it "return the id in the response" do
        expect(json_response).to have_key("id")
      end
    end
  end

  context "when user is an employee" do
    before do
      create(:employment, company:, user:)
      user.add_role :employee, company
      sign_in user
    end

    describe "when creates the vendor" do
      it "returns forbidden" do
        send_request :post, api_v1_vendors_path(vendor: {}), headers: auth_headers(user)
        expect(response).to have_http_status(:forbidden)
      end
    end
  end

  context "when user is a book keeper" do
    before do
      create(:employment, company:, user:)
      user.add_role :book_keeper, company
      sign_in user
    end

    describe "when creates the vendor" do
      it "returns forbidden" do
        send_request :post, api_v1_vendors_path(vendor: {}), headers: auth_headers(user)
        expect(response).to have_http_status(:forbidden)
      end
    end
  end

  context "when unauthenticated" do
    describe "when creates the vendor" do
      it "returns unauthorized" do
        send_request :post, api_v1_vendors_path(vendor: {})
        expect(response).to have_http_status(:unauthorized)
        expect(json_response["error"]).to eq(I18n.t("devise.failure.unauthenticated"))
      end
    end
  end
end
