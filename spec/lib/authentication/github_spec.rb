# frozen_string_literal: true

require "rails_helper"

RSpec.describe Authentication::Github, type: :class do
  describe "user!" do
    let(:user_data) { build(:github_user_data) }

    it "returns nil if user_data is blank" do
      expect(described_class.new(nil).user!).to be_nil
    end

    it "returns nil if user_data uid is nil" do
      user_data.uid = nil

      expect(described_class.new(user_data).user!).to be_nil
    end

    it "returns nil if no github email can be used" do
      user_data.info.email = nil
      user_data.extra.all_emails = []

      expect(described_class.new(user_data).user!).to be_nil
    end

    it "returns the existing identity user if github uid is matched" do
      identity = create(:identity, provider: described_class::PROVIDER, uid: user_data.uid)

      user = described_class.new(user_data).user!

      expect(user.id).to eq(identity.user.id)
    end

    it "returns the existing user if email exists" do
      existing_user = create(:user, email: user_data.info.email)

      user = described_class.new(user_data).user!

      expect(existing_user.id).to eq(user.id)
      expect(existing_user.email).to eq(user.email)
    end

    it "matches an existing user through a verified secondary github email" do
      user_data.info.email = nil
      existing_user = create(:user, email: "secondary@example.com")

      user = described_class.new(user_data).user!

      expect(existing_user.id).to eq(user.id)
      expect(existing_user.identities.find_by(provider: described_class::PROVIDER, uid: user_data.uid)).to be_present
    end

    it "creates a new user and identity when neither exists" do
      user = described_class.new(user_data).user!

      expect(user.email).to eq(user_data.info.email)
      expect(user.identities.find_by(provider: described_class::PROVIDER, uid: user_data.uid)).to be_present
    end

    it "falls back to nickname when first and last names are blank" do
      user_data.info.first_name = nil
      user_data.info.last_name = nil
      user_data.info.name = nil

      user = described_class.new(user_data).user!

      expect(user.first_name).to eq("octocat")
      expect(user.last_name).to eq("octocat")
    end
  end
end
