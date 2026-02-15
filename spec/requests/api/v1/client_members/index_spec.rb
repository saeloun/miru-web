# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Api::V1::ClientMembers", type: :request do
  let(:company) { create(:company) }
  let(:user) { create(:user, current_workspace_id: company.id) }
  let(:client) { create(:client, company:) }

  describe "GET #index" do
    context "when user is an admin" do
      before do
        create(:employment, company:, user:)
        user.add_role :admin, company
        sign_in user
      end

      it "returns client members" do
        send_request :get, api_v1_client_client_members_path(client),
          headers: auth_headers(user)
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
        send_request :get, api_v1_client_client_members_path(client),
          headers: auth_headers(user)
        expect(response).to have_http_status(:forbidden)
      end
    end

    context "when unauthenticated" do
      it "returns unauthorized" do
        send_request :get, api_v1_client_client_members_path(client)
        expect(response).to have_http_status(:unauthorized)
      end
    end
  end

  describe "DELETE #destroy" do
    let(:member_user) { create(:user, current_workspace_id: company.id) }
    let!(:member_employment) { create(:employment, company:, user: member_user) }
    let!(:client_member) { create(:client_member, client:, company:, user: member_user) }

    context "when user is an admin" do
      before do
        create(:employment, company:, user:)
        user.add_role :admin, company
        sign_in user
      end

      it "deletes the client member" do
        send_request :delete, api_v1_client_client_member_path(client, client_member),
          headers: auth_headers(user)
        expect(response).to have_http_status(:ok)
        expect(json_response["notice"]).to eq("Contact deleted successfully")
      end
    end

    context "when unauthenticated" do
      it "returns unauthorized" do
        send_request :delete, api_v1_client_client_member_path(client, client_member)
        expect(response).to have_http_status(:unauthorized)
      end
    end
  end
end
