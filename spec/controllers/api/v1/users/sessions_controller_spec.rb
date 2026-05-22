# frozen_string_literal: true

require "rails_helper"

RSpec.describe Api::V1::Users::SessionsController, type: :controller do
  let(:company) { create(:company) }
  let(:user) { create(:user, :with_avatar, current_workspace_id: company.id) }

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
        expect(json_response["user"]).not_to have_key("token")
        expect(json_response["user"]["current_workspace_id"]).to eq(company.id)
        expect(json_response["company_role"]).to eq("admin")
      end

      it "returns a cli session when app is miru-cli" do
        post :create, params: {
          user: { email: user.email, password: user.password },
          app: "miru-cli"
        }, format: :json

        expect(response).to have_http_status(:ok)

        json_response = JSON.parse(response.body)
        expect(json_response["user"]["email"]).to eq(user.email)
        expect(json_response.dig("cli_session", "token")).to be_present
        expect(json_response.dig("cli_session", "expires_at")).to be_present
        expect(CliSession.count).to eq(1)
      end
    end

    context "with invalid password" do
      it "returns an error" do
        post :create, params: { user: { email: user.email, password: "wrong_password" } }, format: :json

        expect(response).to have_http_status(:unprocessable_content)

        json_response = JSON.parse(response.body)
        expect(json_response["error"]).to be_present
      end
    end

    context "with unconfirmed user" do
      let(:unconfirmed_user) { create(:user, confirmed_at: nil) }

      it "returns an unconfirmed error" do
        post :create, params: { user: { email: unconfirmed_user.email, password: unconfirmed_user.password } }, format: :json

        expect(response).to have_http_status(:unprocessable_content)

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
      before do
        request.headers["X-Auth-Email"] = user.email
        request.headers["X-Auth-Token"] = user.token
      end

      it "returns current user data" do
        get :me, format: :json

        expect(response).to have_http_status(:ok)

        json_response = JSON.parse(response.body)
        expect(json_response["user"]["email"]).to eq(user.email)
        expect(json_response["user"]).not_to have_key("token")
        expect(json_response["user"]["current_workspace_id"]).to eq(user.current_workspace_id)
        expect(json_response["user"]["avatar_url"]).to eq(user.avatar_url)
        expect(json_response["user"]["avatar_url"]).to be_present
        expect(json_response["user"]["password_changed_at"]).to be_present
        expect(Time.zone.parse(json_response["user"]["password_changed_at"]).to_i)
          .to eq(user.password_changed_at.to_i)
        expect(json_response["user"]).not_to have_key("confirmed")
        expect(json_response["company_role"]).to eq("admin")
        expect(json_response["company"]["id"]).to eq(company.id)
      end

      it "does not rotate the browser session limiter for stateless token auth" do
        original_unique_session_id = user.reload.unique_session_id

        get :me, format: :json

        expect(response).to have_http_status(:ok)
        expect(user.reload.unique_session_id).to eq(original_unique_session_id)
      end
    end

    context "when user is not authenticated" do
      it "returns unauthorized error" do
        get :me, format: :json

        expect(response).to have_http_status(:unauthorized)

        json_response = JSON.parse(response.body)
        expect(json_response["error"]).to eq("You need to sign in or sign up before continuing.")
      end
    end

    context "when user has no company role" do
      let(:user_without_role) { create(:user, current_workspace_id: company.id) }

      before do
        request.headers["X-Auth-Email"] = user_without_role.email
        request.headers["X-Auth-Token"] = user_without_role.token
      end

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
