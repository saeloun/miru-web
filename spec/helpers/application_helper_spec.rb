# frozen_string_literal: true

require "rails_helper"

RSpec.describe ApplicationHelper, type: :helper do
  describe ".app_name" do
    it "returns app name" do
      expect(helper.app_name).to eq("Miru Agency OS")
    end
  end

  describe ".user_avatar" do
    context "when user avatar is attached" do
      let(:user) { create(:user, :with_avatar) }

      it "returns user's avatar" do
        expect(helper.user_avatar(user)).to eq(url_for(user.avatar))
      end
    end

    context "when user avatar is not attached" do
      let(:user) { create(:user) }

      it "returns user's avatar" do
        expect(helper.user_avatar(user)).to include("/assets/avatar")
      end
    end
  end
end
