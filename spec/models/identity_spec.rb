# frozen_string_literal: true

# == Schema Information
#
# Table name: identities
#
#  id         :bigint           not null, primary key
#  provider   :string
#  uid        :string
#  created_at :datetime         not null
#  updated_at :datetime         not null
#  user_id    :bigint           not null
#
# Indexes
#
#  index_identities_on_provider  (provider)
#  index_identities_on_user_id   (user_id)
#
# Foreign Keys
#
#  fk_rails_...  (user_id => users.id)
#
require "rails_helper"

RSpec.describe Identity, type: :model do
  describe "Associations" do
    it { is_expected.to belong_to(:user) }
  end

  describe "Scopes" do
    describe ".google_auth" do
      let(:identity1) { create(:identity, provider: "google_oauth2") }
      let(:identity2) { create(:identity, provider: "google_oauth2") }
      let(:identity3) { create(:identity, provider: "facebook") }

      it "returns identities where provider is google_oauth2" do
        expect(described_class.google_auth).to include(identity2, identity1)
      end

      it "excludes identities where provider is google_oauth2" do
        expect(described_class.google_auth).not_to include(identity3)
      end
    end
  end
end
