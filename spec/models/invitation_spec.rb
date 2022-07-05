# frozen_string_literal: true

require "rails_helper"

RSpec.describe Invitation, type: :model do
  subject { build(:invitation) }

  describe "Associations" do
    it { is_expected.to belong_to(:company) }
    it { is_expected.to belong_to(:sender) }
  end

  describe "Validations" do
    it { is_expected.to validate_presence_of(:recipient_email) }
    it { is_expected.to validate_presence_of(:role) }
    it { is_expected.to validate_presence_of(:token) }
    it { is_expected.to validate_uniqueness_of(:token) }
  end

  describe "Scopes" do
    let(:company) { create(:company) }

    before do
      @valid_invitations = create_list(:invitation, 2, company:)
      create_list(:invitation, 2, expired_at: Time.current - 1.day, company:)
      create_list(:invitation, 2, accepted_at: Time.current - 1.day, company:)
    end

    describe ".valid_invitations" do
      it "returns all valid invitations" do
        expect(company.invitations.valid_invitations.size).to eq(2)
        expect(company.invitations.valid_invitations).to match_array(@valid_invitations)
      end
    end
  end
end
