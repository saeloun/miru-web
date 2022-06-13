# frozen_string_literal: true

require "rails_helper"

RSpec.describe "InternalApi::V1::Profile#remove_avatar", type: :request do
  let(:user) { create(:user, :with_avatar) }
  let(:company) { create(:company) }

  describe "remove avatar" do
    before do
      user.add_role :employee, company
      sign_in user
      send_request :delete, remove_avatar_internal_api_v1_profile_path
    end

    it "removes user's avatar" do
      expect(response).to have_http_status(:ok)
      expect(user.reload.avatar.attached?).to be_falsey
    end
  end
end
