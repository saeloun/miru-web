# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Details#show", type: :request do
  let(:employment) { create(:employment, user:, company:) }
  let(:company) { create(:company) }
  let(:company2) { create(:company) }
  let(:user) { create(:user, current_workspace_id: company.id) }
  let(:user2) { create(:user, current_workspace_id: company2.id) }

  context "when Owner wants to see details of employee of his company" do
    before do
      create(:employment, user:, company:)
      user.add_role :owner, company
      sign_in user
      get "/internal_api/v1/team/#{user.id}/details#show"
    end

    it "is successful" do
      expect(response).to have_http_status(:ok)
    end
  end

  context "when Admin wants to see details of employee of his company" do
    before do
      create(:employment, user:, company:)
      user.add_role :admin, company
      sign_in user
      get "/internal_api/v1/team/#{user.id}/details#show"
    end

    it "is successful" do
      expect(response).to have_http_status(:ok)
    end
  end

  context "when logged in user checks his own details" do
    before do
      create(:employment, user:, company:)
      user.add_role :employee, company
      sign_in user
      get "/internal_api/v1/team/#{user.id}/details#show"
    end

    it "is successful" do
      expect(response).to have_http_status(:ok)
    end
  end

  context "when Owner of a company accesses employee details of another company" do
    before do
      create(:employment, user:, company:)
      create(:employment, user: user2, company: company2)
      user.add_role :owner, company
      user2.add_role :employee, company2
      sign_in user
      get "/internal_api/v1/team/#{user2.id}/details#show"
    end

    it "is unsuccessful" do
      expect(response).to have_http_status(:forbidden)
      expect(json_response["errors"]).to eq("You are not authorized to perform this action.")
    end
  end

  context "when Admin of a company accesses employee details of another company" do
    before do
      create(:employment, user:, company:)
      create(:employment, user: user2, company: company2)
      user.add_role :admin, company
      user2.add_role :employee, company2
      sign_in user
      get "/internal_api/v1/team/#{user2.id}/details#show"
    end

    it "is unsuccessful" do
      expect(response).to have_http_status(:forbidden)
      expect(json_response["errors"]).to eq("You are not authorized to perform this action.")
    end
  end

  context "when Employee wants to see details of another employee from different company" do
    before do
      create(:employment, user:, company:)
      create(:employment, user: user2, company: company2)
      user.add_role :employee, company
      user2.add_role :employee, company2
      sign_in user
      get "/internal_api/v1/team/#{user2.id}/details#show"
    end

    it "is unsuccessful" do
      expect(response).to have_http_status(:forbidden)
      expect(json_response["errors"]).to eq("You are not authorized to perform this action.")
    end
  end

  context "when Employee wants to see details of another employee from same company" do
    before do
      create(:employment, user:, company:)
      create(:employment, user: user2, company:)
      user.add_role :employee, company
      user2.add_role :employee, company
      sign_in user
      get "/internal_api/v1/team/#{user2.id}/details#show"
    end

    it "is unsuccessful" do
      expect(response).to have_http_status(:forbidden)
      expect(json_response["errors"]).to eq("You are not authorized to perform this action.")
    end
  end
end
