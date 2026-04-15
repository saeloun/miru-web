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
  let(:invalid_avatar) do
    fixture_file_upload(
      Rails.root.join("spec", "support", "fixtures", "invalid-avatar.txt"),
      "text/plain"
    )
  end

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

    it "preserves uploaded image bytes" do
      expected_bytes = File.binread(Rails.root.join("spec", "support", "fixtures", "test-image.png")).bytes.first(16)

      send_request :put, api_v1_team_avatar_path(team_id: user.id), params: {
        user: { avatar: }
      }, headers: auth_headers(owner)

      stored_bytes = user.reload.avatar.download.bytes.first(16)

      expect(response).to have_http_status(:ok)
      expect(stored_bytes).to eq(expected_bytes)
    end

    it "won't return any error if avatar is not present" do
      send_request :put, api_v1_team_avatar_path(team_id: user.id), params: {
        user: { avatar: nil }
      }, headers: auth_headers(owner)

      expect(response).to have_http_status(:ok)
    end

    it "rejects unsupported avatar content type" do
      send_request :put, api_v1_team_avatar_path(team_id: user.id), params: {
        user: { avatar: invalid_avatar }
      }, headers: auth_headers(owner)

      expect(response).to have_http_status(:unprocessable_content)
      expect(json_response["errors"]).to include("Avatar must be a PNG, JPG, JPEG, or WEBP image")
    end

    it "rejects avatar larger than 5MB" do
      tempfile = Tempfile.new(["large-avatar", ".png"])
      tempfile.binmode
      tempfile.write("0" * 6.megabytes)
      tempfile.rewind
      oversized_avatar = Rack::Test::UploadedFile.new(tempfile.path, "image/png")

      send_request :put, api_v1_team_avatar_path(team_id: user.id), params: {
        user: { avatar: oversized_avatar }
      }, headers: auth_headers(owner)

      expect(response).to have_http_status(:unprocessable_content)
      expect(json_response["errors"]).to include("Avatar must be smaller than 5MB")
    ensure
      tempfile.close!
    end
  end
end
