# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Users::RegistrationsController#purge_avatar", type: :request do
  let(:user) { create(:user, :with_avatar) }

  describe "purge avatar" do
    before do
      send_request :delete, profile_purge_avatar_path, params: { id: user.id }
    end

    it "removes user's avatar and redirect to profile path" do
      expect(response).to redirect_to("/profile")
      expect(user.reload.avatar.image).to be_nil
    end
  end
end
