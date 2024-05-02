# frozen_string_literal: true

require "rails_helper"

RSpec.describe Carryover, type: :model do
  subject { build(:carryover) }

  describe "Associations" do
    it { is_expected.to belong_to(:user) }
    it { is_expected.to belong_to(:company) }
    it { is_expected.to belong_to(:leave_type) }
  end

  describe "Validations" do
    it { is_expected.to validate_presence_of(:from_year) }
    it { is_expected.to validate_presence_of(:to_year) }
    it { is_expected.to validate_presence_of(:total_leave_balance) }
    it { is_expected.to validate_presence_of(:duration) }
  end
end
