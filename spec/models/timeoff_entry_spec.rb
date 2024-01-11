# frozen_string_literal: true

require "rails_helper"

RSpec.describe TimeoffEntry, type: :model do
  describe "validations" do
    it { is_expected.to validate_presence_of(:duration) }

    it do
      expect(subject).to validate_numericality_of(:duration)
        .is_less_than_or_equal_to(6000000)
        .is_greater_than_or_equal_to(0)
    end

    it { is_expected.to validate_presence_of(:leave_date) }
  end

  describe "associations" do
    it { is_expected.to belong_to(:user) }
    it { is_expected.to belong_to(:leave_type).optional(true) }
    it { is_expected.to belong_to(:holiday_info).optional(true) }
  end
end
