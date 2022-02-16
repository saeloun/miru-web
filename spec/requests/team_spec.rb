# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Teams", type: :request do
  let (:company) { create(:company) }
  let(:user) { create(:user, company_id: company.id) }

  before(:each, :user_admin) do
    user.add_role :admin
  end

  before(:each, :user_employee) do
    user.add_role :employee
  end

  context "when authenticated" do
    before do
      sign_in user
    end

    describe "GET /index" do
      it "returns http success" do
        get("/team")
        expect(response).to have_http_status(:found)
      end

      it "admin can access Team#index page" do
        get("/team")
        expect(response).to have_http_status(:found)
      end

      it "employee can't access Team#index page", user_employee: true do
        get("/team")
        expect(response).to have_http_status(:redirect)
        expect(flash[:alert]).to eq("You are not authorized to perform this action.")
      end
    end

    describe "GET /edit" do
      before do
        sign_in user
      end

      it "returns http success" do
        get edit_team_path(user)
        expect(response).to have_http_status(:found)
      end

      it "admin can access Team#edit page" do
        get edit_team_path(user)
        expect(response).to have_http_status(:found)
      end

      it "employee can't access Team#edit page", user_employee: true do
        get edit_team_path(user)
        expect(response).to have_http_status(:redirect)
        expect(flash[:alert]).to eq("You are not authorized to perform this action.")
      end
    end

    describe "PATCH /update" do
      context "Admin user", user_admin: true do
        before do
          send_request(:put, team_path(user), params: {
            user: {
              first_name: "test",
              last_name: "example",
              email: "test@example.com",
              roles: "admin"
            }
          })
        end

        it "admin can update the user" do
          user.reload
          expect(user.first_name).to eq("test")
          expect(user.last_name).to eq("example")
          expect(user.email).to eq("test@example.com")
        end

        it "redirects to root_path " do
          expect(response).to have_http_status(:redirect)
        end
      end

      context "Employee", user_employee: true do
        before do
          send_request(:put, team_path(user), params: {
            user: {
              first_name: "test",
              last_name: "example",
              email: "test@example.com",
              roles: "admin"
            }
          })
        end

        it "can't update user" do
          expect(response).to have_http_status(:redirect)
          expect(flash[:alert]).to eq("You are not authorized to perform this action.")
        end
      end
    end

    describe "DELETE /destroy" do
      context "Admin user", user_admin: true do
        before do
          send_request(:delete, team_path(user))
        end

        it "admin can delete the user" do
          user.reload
          expect(user.discarded_at).not_to be_nil
        end
      end
    end

    context "Employee", user_employee: true do
      before do
        send_request(:delete, team_path(user))
      end

      it "employee can't delete the user" do
        expect(response).to have_http_status(:redirect)
        expect(flash[:alert]).to eq("You are not authorized to perform this action.")
      end
    end
  end
end
