# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Api::V1::TeamMembers::AvatarController#update", type: :request do
  let(:company) { create(:company) }
  let(:company2) { create(:company) }
  let(:admin) { create(:user, current_workspace_id: company.id) }
  let(:owner) { create(:user, current_workspace_id: company.id) }
  let(:user) { create(:user, :with_avatar, current_workspace_id: company.id) }
  let(:user2) { create(:user, :with_avatar, current_workspace_id: company2.id) }
  let(:avatar) { fixture_file_upload(Rails.root.join("spec", "support", "fixtures", "test-image.png"), "image/png") }

  context "when Owner wants to update avatar of employee of his company" do
    before do
      create(:employment, user: admin, company:)
      create(:employment, user:, company:)

      owner.add_role :owner, company
      user.add_role :employee, company
      sign_in owner
    end

    it "is successful" do
      send_request :put, api_v1_team_avatar_path(team_id: user.id), params: {
        user: { avatar: }
      }, headers: auth_headers(owner)

      expect(response).to have_http_status(:ok)
      expect(user.reload.avatar).to be_present
    end

    it "won't return any error if avatar is not present" do
      send_request :put, api_v1_team_avatar_path(team_id: user.id), params: {
        user: { avatar: nil }
      }, headers: auth_headers(owner)

      expect(response).to have_http_status(:ok)
    end
  end
end
