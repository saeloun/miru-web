# frozen_string_literal: true

require "rails_helper"

RSpec.describe "InternalApi::V1::Vendors#create", type: :request do
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
        @vendor = attributes_for(:vendor)
        send_request :post, internal_api_v1_vendors_path(vendor: @vendor)
      end

      it "return the success" do
        expect(response).to have_http_status(:ok)
      end

      it "adds the vendor entry to the database" do
        expect(Vendor.last.name).to eq(@vendor[:name])
      end

      it "return the id and name in the response" do
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
        send_request :post, internal_api_v1_vendors_path(vendor: {})
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
        send_request :post, internal_api_v1_vendors_path(vendor: {})
        expect(response).to have_http_status(:forbidden)
      end
    end
  end

  context "when unauthenticated" do
    describe "when creates the vendor" do
      it "returns unauthorized" do
        send_request :post, internal_api_v1_vendors_path(vendor: {})
        expect(response).to have_http_status(:unauthorized)
        expect(json_response["error"]).to eq("You need to sign in or sign up before continuing.")
      end
    end
  end
end
