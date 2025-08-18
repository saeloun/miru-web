# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Api::V1::TeamMembers::AvatarController#destroy", type: :request do
  let(:company) { create(:company) }
  let(:company2) { create(:company) }
  let(:admin) { create(:user, current_workspace_id: company.id) }
  let(:owner) { create(:user, current_workspace_id: company.id) }
  let(:user) { create(:user, :with_avatar, current_workspace_id: company.id) }
  let(:user2) { create(:user, :with_avatar, current_workspace_id: company2.id) }

  context "when admin wants to remove avatar of employee of his company" do
    before do
      create(:employment, user: admin, company:)
      create(:employment, user:, company:)

      admin.add_role :admin, company
      user.add_role :employee, company
      sign_in admin

      send_request :delete, api_v1_team_avatar_path(user.id), headers: auth_headers(admin)
    end

    it "removes user's avatar" do
      expect(response).to have_http_status(:ok)
      expect(user.reload.avatar.attached?).to be_falsey
    end
  end

  context "when owner wants to remove avatar of employee of his company" do
    before do
      create(:employment, user: owner, company:)
      create(:employment, user:, company:)

      owner.add_role :owner, company
      user.add_role :employee, company
      sign_in owner
      send_request :delete, api_v1_team_avatar_path(user.id), headers: auth_headers(owner)
    end

    it "removes user's avatar" do
      expect(response).to have_http_status(:ok)
      expect(user.reload.avatar.attached?).to be_falsey
    end
  end

  context "when employee wants to remove own avatar" do
    before do
      create(:employment, user:, company:)

      user.add_role :employee, company
      sign_in user
      send_request :delete, api_v1_team_avatar_path(user.id), headers: auth_headers(user)
    end

    it "removes user's avatar" do
      expect(response).to have_http_status(:ok)
      expect(user.reload.avatar.attached?).to be_falsey
    end
  end

  context "when logged in admin wants to remove avatar of employee from a different company" do
    before do
      create(:employment, user: admin, company:)
      create(:employment, user: user2, company: company2)

      admin.add_role :admin, company
      user2.add_role :employee, company2
      sign_in admin
      send_request :delete, api_v1_team_avatar_path(user2.id), headers: auth_headers(admin)
    end

    it "is unsuccessful" do
      expect(response).to have_http_status(:not_found)
    end
  end

  context "when logged in owner wants to remove avatar of employee from a different company" do
    before do
      create(:employment, user: owner, company:)
      create(:employment, user: user2, company: company2)

      owner.add_role :owner, company
      user2.add_role :employee, company2
      sign_in owner
      send_request :delete, api_v1_team_avatar_path(user2.id), headers: auth_headers(owner)
    end

    it "is unsuccessful" do
      expect(response).to have_http_status(:not_found)
    end
  end

  context "when logged in employee wants to remove avatar of another employee from a same company" do
    before do
      create(:employment, user:, company:)
      create(:employment, user: user2, company:)

      user.add_role :employee, company
      user2.add_role :employee, company
      sign_in user
      send_request :delete, api_v1_team_avatar_path(user2.id), headers: auth_headers(user)
    end

    it "is unsuccessful" do
      expect(response).to have_http_status(:forbidden)
      expect(json_response["errors"]).to eq("You are not authorized to perform this action.")
    end
  end
end
