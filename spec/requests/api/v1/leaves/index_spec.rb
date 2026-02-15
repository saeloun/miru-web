# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Api::V1::Leaves", type: :request do
  let(:company) { create(:company) }
  let(:user) { create(:user, current_workspace_id: company.id) }

  describe "GET #index" do
    context "when user is an admin" do
      before do
        create(:employment, company:, user:)
        user.add_role :admin, company
        sign_in user
        create(:leave, company:, year: 2024)
      end

      it "returns all leaves for the company" do
        send_request :get, api_v1_leave_index_path, headers: auth_headers(user)
        expect(response).to have_http_status(:ok)
      end
    end

    context "when user is an employee" do
      before do
        create(:employment, company:, user:)
        user.add_role :employee, company
        sign_in user
      end

      it "is not permitted" do
        send_request :get, api_v1_leave_index_path, headers: auth_headers(user)
        expect(response).to have_http_status(:forbidden)
      end
    end

    context "when unauthenticated" do
      it "returns unauthorized" do
        send_request :get, api_v1_leave_index_path
        expect(response).to have_http_status(:unauthorized)
      end
    end
  end

  describe "POST #create" do
    context "when user is an admin" do
      before do
        create(:employment, company:, user:)
        user.add_role :admin, company
        sign_in user
      end

      it "creates a new leave" do
        send_request :post, api_v1_leave_index_path,
          params: { leave: { year: 2025 } },
          headers: auth_headers(user)
        expect(response).to have_http_status(:ok)
        expect(json_response["notice"]).to eq("Leave created successfully")
      end
    end

    context "when user is an employee" do
      before do
        create(:employment, company:, user:)
        user.add_role :employee, company
        sign_in user
      end

      it "is not permitted" do
        send_request :post, api_v1_leave_index_path,
          params: { leave: { year: 2025 } },
          headers: auth_headers(user)
        expect(response).to have_http_status(:forbidden)
      end
    end

    context "when unauthenticated" do
      it "returns unauthorized" do
        send_request :post, api_v1_leave_index_path,
          params: { leave: { year: 2025 } }
        expect(response).to have_http_status(:unauthorized)
      end
    end
  end
end
