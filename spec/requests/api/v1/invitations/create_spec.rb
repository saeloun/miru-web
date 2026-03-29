# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Api::V1::Invitations#create", type: :request do
  let(:company) { create(:company) }
  let(:user) { create(:user, current_workspace_id: company.id) }

  before do
    create(:employment, company:, user:)
    user.add_role :admin, company
    sign_in user
  end

  context "when new user is invited" do
    describe "passed valid first_name, last_name, email and role" do
      before do
        send_request :post, api_v1_invitations_path, params: {
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
        send_request :post, api_v1_invitations_path, params: {
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
        expect(json_response["errors"]).to eq("First name is invalid")
      end

      it "doesn't create invitation record" do
        expect(Invitation.count).to eq(0)
      end
    end

    describe "passed invalid recipient_email" do
      before do
        send_request :post, api_v1_invitations_path, params: {
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
        existing_user = create(:user)

        send_request :post, api_v1_invitations_path, params: {
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
        existing_user = create(:user)

        send_request :post, api_v1_invitations_path, params: {
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
        expect(json_response["errors"]).to eq("First name is invalid")
      end

      it "doesn't create invitation record" do
        expect(Invitation.count).to eq(0)
      end
    end

    describe "passed invalid recipient_email" do
      before do
        existing_user = create(:user)

        send_request :post, api_v1_invitations_path, params: {
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
        expect(json_response["errors"]).to eq("Recipient email is invalid")
      end

      it "doesn't create invitation record" do
        expect(Invitation.count).to eq(0)
      end
    end

    describe "passed invalid role" do
      before do
        existing_user = create(:user)

        send_request :post, api_v1_invitations_path, params: {
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
        expect(json_response["errors"]).to eq("Role can't be blank")
      end

      it "doesn't create invitation record" do
        expect(Invitation.count).to eq(0)
      end
    end
  end

  context "when a free workspace is already at the team seat limit" do
    let(:company) { create(:company, plan_tier: "free") }

    before do
      create_list(:employment, 2, company:) do |employment|
        employment.user = create(:user, current_workspace_id: company.id)
        employment.user.add_role :employee, company
      end
    end

    it "blocks another team invite and prompts an upgrade" do
      send_request :post, api_v1_invitations_path, params: {
        first_name: "Extra",
        last_name: "Member",
        recipient_email: "extra@example.com",
        role: "employee"
      }, headers: auth_headers(user)

      expect(response).to have_http_status(:forbidden)
      expect(json_response["notice"]).to eq("Upgrade required")
      expect(json_response["errors"]).to eq("Free workspaces are limited to 3 team seats. Upgrade to Pro to invite more members.")
      expect(Invitation.count).to eq(0)
    end

    it "still allows client invites" do
      send_request :post, api_v1_invitations_path, params: {
        first_name: "Client",
        last_name: "Contact",
        recipient_email: "client-contact@example.com",
        role: "client"
      }, headers: auth_headers(user)

      expect(response).to have_http_status(:created)
      expect(Invitation.count).to eq(1)
    end
  end
end
