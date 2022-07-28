# frozen_string_literal: true

require "rails_helper"

RSpec.describe PreviousEmployment, type: :model do
  subject { build(:previous_employment) }

  describe "Associations" do
      it { is_expected.to belong_to(:user) }
    end

  describe "Validations" do
    it { is_expected.to validate_length_of(:company_name).is_at_most(50) }
    it { is_expected.to validate_length_of(:role).is_at_most(50) }
  end
end
