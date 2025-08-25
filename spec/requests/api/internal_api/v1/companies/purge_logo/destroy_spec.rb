# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Api::V1::Companies::PurgeLogo#destroy", type: :request do
  let(:company) { create(:company, :with_logo) }
  let(:user1) { create(:user, current_workspace: company) }
  let(:employment) { create(:employment, company:, user: user1) }
  let(:user2) { create(:user) }

  context "when user is not an admin" do
    before do
      sign_in user2
      send_request(:delete, "/api/v1/companies/#{company.id}/purge_logo", headers: auth_headers(user2))
    end

    it "response should be forbidded" do
      expect(response).to have_http_status(:forbidden)
    end

    it "returns error json response" do
      expect(json_response["errors"]).to match("You are not authorized to perform this action")
    end
  end

  context "when user is an admin" do
    before do
      user1.add_role :admin, company
      sign_in user1
      send_request(:delete, "/api/v1/companies/#{company.id}/purge_logo", headers: auth_headers(user1))
    end

    it "successful status" do
      expect(response).to be_successful
    end

    it "successful notice" do
      expect(json_response["notice"]).to eq(I18n.t("companies.purge_logo.destroy.success"))
    end
  end
end
