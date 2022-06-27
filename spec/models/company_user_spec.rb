# frozen_string_literal: true

require "rails_helper"

RSpec.describe CompanyUser, type: :model do
  let(:company_user) { create(:company_user) }
  let(:company) { company_user.company }
  let(:user) { company_user.user }

  describe "Associations" do
    it { is_expected.to belong_to(:company) }
    it { is_expected.to belong_to(:user) }
  end

  describe "Discard" do
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

  # describe "Validations" do
  #   it { is_expected.to validate_presence_of(:designation) }
  #   it { is_expected.to validate_presence_of(:employment_type) }
  #   it { is_expected.to validate_presence_of(:joined_at) }
  #   it { is_expected.to validate_presence_of(:employee_id) }
  # end

  describe "Comparisons" do
    it "resignation date should be nil by default" do
      expect(company_user.resigned_at).to be nil
    end
  end
end
