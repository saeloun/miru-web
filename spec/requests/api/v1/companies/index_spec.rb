# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Api::V1::Companies::index", type: :request do
  let(:company) { create(:company) }
  let(:user) { create(:user, current_workspace_id: company.id) }

  before do
    create(:employment, company:, user:)
  end

  context "when user is an admin" do
    before do
      user.add_role :admin, company
      sign_in user
      send_request :get, api_v1_companies_path, headers: auth_headers(user)
    end

    it_behaves_like "Api::V1::Companies::index success response"
  end

  context "when user is an owner" do
    before do
      user.add_role :owner, company
      sign_in user
      send_request :get, api_v1_companies_path, headers: auth_headers(user)
    end

    it_behaves_like "Api::V1::Companies::index success response"
  end

  context "when user is a book keeper" do
    before do
      user.add_role :book_keeper, company
      sign_in user
      send_request :get, api_v1_companies_path, headers: auth_headers(user)
    end

    it "is not be permitted to view a company" do
      expect(response).to have_http_status(:forbidden)
    end
  end
end
