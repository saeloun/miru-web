# frozen_string_literal: true

require "rails_helper"

RSpec.describe EmploymentDetail, type: :model do
  subject(:employment_detail) { build(:employment_detail) }

  describe "Validations" do
    describe "Associations" do
      it { is_expected.to belong_to(:user) }
    end

    describe "Presence" do
      it { is_expected.to validate_presence_of(:designation) }
      it { is_expected.to validate_presence_of(:employment_type) }
      it { is_expected.to validate_presence_of(:joined_at) }
      it { is_expected.to validate_presence_of(:employee_id) }
    end

    describe "validate comparisons" do
      it "resignation date should be later than joining date" do
        expect(employment_detail.resigned_at).to be > employment_detail.joined_at
      end
    end
  end
end
