# frozen_string_literal: true

require "rails_helper"

RSpec.describe Authentication::Google, type: :class do
  describe "user!" do
    let(:user_data) { build(:google_user_data) }

    it "returns nil if user_data is blank" do
      expect(Authentication::Google.new(nil).user!).to be_nil
    end

    it "returns nil if user_data uid is nil or empty" do
      user_data.uid = nil
      expect(Authentication::Google.new(user_data).user!).to be_nil
    end

    it "returns the existing identity user if google uid is matched" do
      identity = create(:identity, provider: Authentication::Google::PROVIDER, uid: "100000000000000000000")

      user = Authentication::Google.new(user_data).user!
      expect(user.id).to eq(identity.user.id)
    end

    it "returns the existing user, if user with email exists" do
      existing_user = create(:user, email: "john@example.com")

      user = Authentication::Google.new(user_data).user!
      expect(existing_user.id).to eq(user.id)
      expect(existing_user.email).to eq(user.email)
    end

    it "returns and create a new user if user or user identity does not exists in our system" do
      expect(User.find_by_email(user_data.info.email)).to be_nil
      expect(User.find_by_first_name(user_data.info.first_name)).to be_nil
      expect(User.find_by_last_name(user_data.info.last_name)).to be_nil
      expect(Identity.google_auth.where(uid: user_data.uid)&.first).to be_nil

      user = Authentication::Google.new(user_data).user!

      expect(user.email).to eq(user_data.info.email)
      identity = user.identities.find_by(provider: Authentication::Google::PROVIDER, uid: user_data.uid)
      expect(identity.present?).to be_truthy
    end
  end
end
