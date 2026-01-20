# frozen_string_literal: true

require "rails_helper"

RSpec.describe "InternalApi::V1::Invitations#create", type: :request do
  let(:company) { create(:company) }
  let(:user) { create(:user, current_workspace_id: company.id) }

  context "when new user is invited" do
    describe "passed valid first_name, last_name, email and role" do
      before do
        create(:employment, company:, user:)
        user.add_role :admin, company
        sign_in user

        send_request :post, internal_api_v1_invitations_path, params: {
          first_name: "test",
          last_name: "example",
          recipient_email: "test@example.com",
          role: "employee"
        }, headers: auth_headers(user)
      end

      it "returns success response with :CREATED status" do
        expect(response).to be_successful
        expect(response).to have_http_status(:created)
      end

      it "return success message" do
        expect(json_response["notice"]).to eq(I18n.t("invitation.create.success.message"))
      end

      it "creates invitation record" do
        expect(Invitation.count).to eq(1)
      end
    end

    describe "passed invalid first_name and last_name" do
      before do
        create(:employment, company:, user:)
        user.add_role :admin, company
        sign_in user

        send_request :post, internal_api_v1_invitations_path, params: {
          first_name: "test1",
          last_name: "example2",
          recipient_email: "test@example.com",
          role: "employee"
        }, headers: auth_headers(user)
      end

      it "returns failed status" do
        expect(response).not_to be_successful
        expect(response).to have_http_status(:unprocessable_content)
      end

      it "return error message" do
        expect(json_response["notice"]).to eq("Failed to saved changes")
        expect(json_response["errors"]).to eq("First name is invalid")
      end

      it "doesn't create invitation record" do
        expect(Invitation.count).to eq(0)
      end
    end

    describe "passed invalid recipient_email" do
      before do
        create(:employment, company:, user:)
        user.add_role :admin, company
        sign_in user

        send_request :post, internal_api_v1_invitations_path, params: {
          first_name: "test",
          last_name: "example",
          recipient_email: "testexamplecom",
          role: "employee"
        }, headers: auth_headers(user)
      end

      it "returns failed status" do
        expect(response).not_to be_successful
        expect(response).to have_http_status(:unprocessable_content)
      end

      it "return error message" do
        expect(json_response["notice"]).to eq("Failed to saved changes")
        expect(json_response["errors"]).to eq("Recipient email is invalid")
      end

      it "doesn't create invitation record" do
        expect(Invitation.count).to eq(0)
      end
    end
  end

  context "when user already exists in application" do
    describe "passed valid first_name, last_name, email and role" do
      before do
        create(:employment, company:, user:)
        user.add_role :admin, company
        existing_user = create(:user)
        sign_in user

        send_request :post, internal_api_v1_invitations_path, params: {
          first_name: existing_user.first_name,
          last_name: existing_user.last_name,
          recipient_email: existing_user.email,
          role: "employee"
        }, headers: auth_headers(user)
      end

      it "returns success response with :CREATED status" do
        expect(response).to be_successful
        expect(response).to have_http_status(:created)
      end

      it "return success message" do
        expect(json_response["notice"]).to eq(I18n.t("invitation.create.success.message"))
      end

      it "creates invitation record" do
        expect(Invitation.count).to eq(1)
      end
    end

    describe "passed invalid first_name and last_name" do
      before do
        create(:employment, company:, user:)
        user.add_role :admin, company
        existing_user = create(:user)
        sign_in user

        send_request :post, internal_api_v1_invitations_path, params: {
          first_name: "test1",
          last_name: "example2",
          recipient_email: existing_user.email,
          role: "employee"
        }, headers: auth_headers(user)
      end

      it "returns failed status" do
        expect(response).not_to be_successful
        expect(response).to have_http_status(:unprocessable_content)
      end

      it "return error message" do
        expect(json_response["notice"]).to eq("Failed to saved changes")
        expect(json_response["errors"]).to eq("First name is invalid")
      end

      it "doesn't create invitation record" do
        expect(Invitation.count).to eq(0)
      end
    end

    describe "passed invalid recipient_email" do
      before do
        create(:employment, company:, user:)
        user.add_role :admin, company
        existing_user = create(:user)
        sign_in user

        send_request :post, internal_api_v1_invitations_path, params: {
          first_name: existing_user.first_name,
          last_name: existing_user.last_name,
          recipient_email: "testexamplecom",
          role: "employee"
        }, headers: auth_headers(user)
      end

      it "returns failed status" do
        expect(response).not_to be_successful
        expect(response).to have_http_status(:unprocessable_content)
      end

      it "return error message" do
        expect(json_response["notice"]).to eq("Failed to saved changes")
        expect(json_response["errors"]).to eq("Recipient email is invalid")
      end

      it "doesn't create invitation record" do
        expect(Invitation.count).to eq(0)
      end
    end

    describe "passed invalid role" do
      before do
        create(:employment, company:, user:)
        user.add_role :admin, company
        existing_user = create(:user)
        sign_in user

        send_request :post, internal_api_v1_invitations_path, params: {
          first_name: existing_user.first_name,
          last_name: existing_user.last_name,
          recipient_email: "test@example.com",
          role: ""
        }, headers: auth_headers(user)
      end

      it "returns failed status" do
        expect(response).not_to be_successful
        expect(response).to have_http_status(:unprocessable_content)
      end

      it "return error message" do
        expect(json_response["notice"]).to eq("Failed to saved changes")
        expect(json_response["errors"]).to eq("Role can't be blank")
      end

      it "doesn't create invitation record" do
        expect(Invitation.count).to eq(0)
      end
    end
  end
end
