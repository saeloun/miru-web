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
    it "discards the company user" do
      expect { employment.discard! }.to change(company.employments.discarded, :count).by(1)
      expect(employment.reload.discarded?).to be_truthy
      expect(user.reload.employments.discarded.count).to eq(1)
    end

    it "does not discard the company user if already discarded" do
      employment.discard!
      expect { employment.discard! }.to raise_error(Discard::RecordNotDiscarded)
    end
  end

  describe "Validations" do
    it { is_expected.to validate_presence_of(:designation) }
    it { is_expected.to validate_presence_of(:employment_type) }
    it { is_expected.to validate_presence_of(:joined_at) }
    it { is_expected.to validate_presence_of(:employee_id) }
  end
end
