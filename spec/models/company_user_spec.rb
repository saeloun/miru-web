# frozen_string_literal: true

require "rails_helper"

RSpec.describe CompanyUser, type: :model do
  describe "Associations" do
    it { is_expected.to belong_to(:company) }
    it { is_expected.to belong_to(:user) }
  end

  describe "Discard" do
    let(:company_user) { create(:company_user) }
    let(:company) { company_user.company }
    let(:user) { company_user.user }

    it "discards the company user" do
      expect { company_user.discard! }.to change(company.company_users.discarded, :count).by(1)
      expect(company_user.reload.discarded?).to be_truthy
      expect(user.reload.company_users.discarded.count).to eq(1)
    end

    it "does not discard the company user if already discarded" do
      company_user.discard!
      expect { company_user.discard! }.to raise_error(Discard::RecordNotDiscarded)
    end
  end
end
