# frozen_string_literal: true

require "rails_helper"

RSpec.describe InternalApi::V1::Users::SessionsController, type: :controller do
  let(:company) { create(:company) }
  let(:user) { create(:user, current_workspace_id: company.id) }

  before do
    @request.env["devise.mapping"] = Devise.mappings[:user]
    user.add_role(:admin, company)
  end

  describe "POST #create" do
    context "with valid credentials" do
      it "signs in the user and returns user data" do
        post :create, params: { user: { email: user.email, password: user.password } }, format: :json

        expect(response).to have_http_status(:ok)

        json_response = JSON.parse(response.body)
        expect(json_response["user"]["email"]).to eq(user.email)
        expect(json_response["user"]["token"]).to be_present
        expect(json_response["user"]["current_workspace_id"]).to eq(company.id)
        expect(json_response["company_role"]).to eq("admin")
      end
    end

    context "with invalid password" do
      it "returns an error" do
        post :create, params: { user: { email: user.email, password: "wrong_password" } }, format: :json

        expect(response).to have_http_status(:unprocessable_entity)

        json_response = JSON.parse(response.body)
        expect(json_response["error"]).to be_present
      end
    end

    context "with unconfirmed user" do
      let(:unconfirmed_user) { create(:user, confirmed_at: nil) }

      it "returns an unconfirmed error" do
        post :create, params: { user: { email: unconfirmed_user.email, password: unconfirmed_user.password } }, format: :json

        expect(response).to have_http_status(:unprocessable_entity)

        json_response = JSON.parse(response.body)
        expect(json_response["unconfirmed"]).to be true
      end
    end
  end

  describe "DELETE #destroy" do
    before { sign_in user }

    it "signs out the user" do
      delete :destroy, format: :json

      expect(response).to have_http_status(:ok)

      json_response = JSON.parse(response.body)
      expect(json_response["notice"]).to be_present
      expect(json_response["reset_session"]).to be true
    end
  end

  describe "GET #me" do
    context "when user is authenticated" do
      before { sign_in user }

      it "returns current user data" do
        get :me, format: :json

        expect(response).to have_http_status(:ok)

        json_response = JSON.parse(response.body)
        expect(json_response["user"]["email"]).to eq(user.email)
        expect(json_response["user"]["token"]).to eq(user.token)
        expect(json_response["user"]["current_workspace_id"]).to eq(user.current_workspace_id)
        expect(json_response["user"]["avatar_url"]).to eq(user.avatar_url)
        expect(json_response["user"]["confirmed"]).to eq(user.confirmed?)
        expect(json_response["company_role"]).to eq("admin")
        expect(json_response["company"]["id"]).to eq(company.id)
      end
    end

    context "when user is not authenticated" do
      it "returns unauthorized error" do
        get :me, format: :json

        expect(response).to have_http_status(:unauthorized)

        json_response = JSON.parse(response.body)
        expect(json_response["error"]).to eq("Not authenticated")
      end
    end

    context "when user has no company role" do
      let(:user_without_role) { create(:user, current_workspace_id: company.id) }

      before { sign_in user_without_role }

      it "returns user data with nil company_role" do
        get :me, format: :json

        expect(response).to have_http_status(:ok)

        json_response = JSON.parse(response.body)
        expect(json_response["user"]["email"]).to eq(user_without_role.email)
        expect(json_response["company_role"]).to be_nil
      end
    end
  end
end
