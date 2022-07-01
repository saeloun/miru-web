# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Users::Invitations#create", type: :request do
  let(:company) { create(:company) }
  let(:user) { create(:user, current_workspace_id: company.id) }

  context "when user doesn't exists in application" do
    describe "passed valid first_name, last_name, email and role" do
      before do
        create(:company_user, company:, user:)
        user.add_role :admin, company
        sign_in user

        send_request :post, users_invitations_path, params: {
          invitation: {
            first_name: "test",
            last_name: "example",
            recipient_email: "test@example.com",
            role: "employee"
          }
        }
      end

      it "returns redirect status" do
        expect(response).to have_http_status(:redirect)
      end

      it "redirects to root page" do
        expect(response).to redirect_to(team_index_path)
      end

      it "return success flash message" do
        expect(flash[:success]).to eq("Invitation will be sent")
      end

      it "creates invitation record" do
        expect(Invitation.count).to eq(1)
      end
    end

    describe "passed invalid first_name and last_name" do
      before do
        create(:company_user, company:, user:)
        user.add_role :admin, company
        sign_in user

        send_request :post, users_invitations_path, params: {
          invitation: {
            first_name: "test1",
            last_name: "example2",
            recipient_email: "test@example.com",
            role: "employee"
          }
        }
      end

      it "returns redirect status" do
        expect(response).to have_http_status(:redirect)
      end

      it "redirects to root page" do
        expect(response).to redirect_to(team_index_path)
      end

      it "return success flash message" do
        expect(flash[:error]).to eq("First name is invalid, Last name is invalid")
      end

      it "creates invitation record" do
        expect(Invitation.count).to eq(0)
      end
    end

    describe "passed invalid recipient_email" do
      before do
        create(:company_user, company:, user:)
        user.add_role :admin, company
        sign_in user

        send_request :post, users_invitations_path, params: {
          invitation: {
            first_name: "test",
            last_name: "example",
            recipient_email: "testexamplecom",
            role: "employee"
          }
        }
      end

      it "returns redirect status" do
        expect(response).to have_http_status(:redirect)
      end

      it "redirects to root page" do
        expect(response).to redirect_to(team_index_path)
      end

      it "return success flash message" do
        expect(flash[:error]).to eq("Recipient email is invalid")
      end

      it "creates invitation record" do
        expect(Invitation.count).to eq(0)
      end
    end
  end

  context "when user already exists in application" do
    describe "passed valid first_name, last_name, email and role" do
      before do
        create(:company_user, company:, user:)
        user.add_role :admin, company
        existing_user = create(:user)
        sign_in user

        send_request :post, users_invitations_path, params: {
          invitation: {
            first_name: existing_user.first_name,
            last_name: existing_user.last_name,
            recipient_email: existing_user.email,
            role: "employee"
          }
        }
      end

      it "returns redirect status" do
        expect(response).to have_http_status(:redirect)
      end

      it "redirects to root page" do
        expect(response).to redirect_to(team_index_path)
      end

      it "return success flash message" do
        expect(flash[:success]).to eq("Invitation will be sent")
      end

      it "creates invitation record" do
        expect(Invitation.count).to eq(1)
      end
    end

    describe "passed invalid first_name and last_name" do
      before do
        create(:company_user, company:, user:)
        user.add_role :admin, company
        existing_user = create(:user)
        sign_in user

        send_request :post, users_invitations_path, params: {
          invitation: {
            first_name: "test1",
            last_name: "example2",
            recipient_email: existing_user.email,
            role: "employee"
          }
        }
      end

      it "returns redirect status" do
        expect(response).to have_http_status(:redirect)
      end

      it "redirects to root page" do
        expect(response).to redirect_to(team_index_path)
      end

      it "return success flash message" do
        expect(flash[:error]).to eq("First name is invalid, Last name is invalid")
      end

      it "creates invitation record" do
        expect(Invitation.count).to eq(0)
      end
    end

    describe "passed invalid recipient_email" do
      before do
        create(:company_user, company:, user:)
        user.add_role :admin, company
        existing_user = create(:user)
        sign_in user

        send_request :post, users_invitations_path, params: {
          invitation: {
            first_name: existing_user.first_name,
            last_name: existing_user.last_name,
            recipient_email: "testexamplecom",
            role: "employee"
          }
        }
      end

      it "returns redirect status" do
        expect(response).to have_http_status(:redirect)
      end

      it "redirects to root page" do
        expect(response).to redirect_to(team_index_path)
      end

      it "return success flash message" do
        expect(flash[:error]).to eq("Recipient email is invalid")
      end

      it "creates invitation record" do
        expect(Invitation.count).to eq(0)
      end
    end
  end
end
