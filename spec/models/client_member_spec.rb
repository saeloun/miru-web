# frozen_string_literal: true

require "rails_helper"

RSpec.describe ClientMember, type: :model do
  let(:company) { create(:company) }
  let(:client) { create(:client) }
  let(:user) { create(:user) }

  describe "validations" do
    it "is valid with valid attributes" do
      client_member = build(:client_member, company:, client:, user:)
      expect(client_member).to be_valid
    end

    it "is not valid without a user" do
      client_member = build(:client_member, company:, client:, user: nil)
      expect(client_member).not_to be_valid
      expect(client_member.errors[:user]).to include("must exist")
    end

    it "is not valid without a client" do
      client_member = build(:client_member, company:, client: nil, user:)
      expect(client_member).not_to be_valid
      expect(client_member.errors[:client]).to include("must exist")
    end

    it "is not valid without a company" do
      client_member = build(:client_member, company: nil, client:, user:)
      expect(client_member).not_to be_valid
      expect(client_member.errors[:company]).to include("must exist")
    end

    it "is not valid with a duplicate client and user" do
      existing_client_member = create(:client_member)

      client_member = build(
        :client_member, company: existing_client_member.company,
        client: existing_client_member.client, user: existing_client_member.user)
      expect(client_member).not_to be_valid
      expect(client_member.errors[:client_id]).to include("A client member with this client and user already exists")
    end
  end

  describe "associations" do
    it { is_expected.to belong_to(:company) }
    it { is_expected.to belong_to(:client) }
    it { is_expected.to belong_to(:user) }
  end
end
