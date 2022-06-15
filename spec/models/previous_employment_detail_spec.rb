# frozen_string_literal: true

require "rails_helper"

RSpec.describe PreviousEmploymentDetail, type: :model do
  subject(:previous_employment_detail) { build(:previous_employment_detail) }

  describe "Validations" do
    it { is_expected.to validate_length_of(:company_name).is_at_most(50) }
    it { is_expected.to validate_length_of(:role).is_at_most(50) }
  end
end
