# frozen_string_literal: true

require "rails_helper"

RSpec.describe Employment, type: :model do
  let(:employment) { create(:employment) }
  let(:company) { employment.company }
  let(:user) { employment.user }

  describe "Associations" do
    it { is_expected.to belong_to(:company) }
    it { is_expected.to belong_to(:user) }
  end

  describe "Discard" do
    it "discards the employments" do
      expect { employment.discard! }.to change(company.employments.discarded, :count).by(1)
      expect(employment.reload.discarded?).to be_truthy
      expect(user.reload.employments.discarded.count).to eq(1)
    end

    it "does not discard the employments if already discarded" do
      employment.discard!
      expect { employment.discard! }.to raise_error(Discard::RecordNotDiscarded)
    end
  end

  describe "Validations" do
    it { is_expected.to validate_presence_of(:designation).on(:update) }
    it { is_expected.to validate_presence_of(:employment_type).on(:update) }
    it { is_expected.to validate_presence_of(:joined_at).on(:update) }
    it { is_expected.to validate_presence_of(:employee_id).on(:update) }
  end

  describe "validate comparisons" do
    it "joining date should not be after than resigned_at date" do
      expect(employment.joined_at).to be <= employment.resigned_at
    end
  end
end
