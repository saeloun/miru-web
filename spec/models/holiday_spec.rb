# frozen_string_literal: true

# == Schema Information
#
# Table name: holidays
#
#  id                              :bigint           not null, primary key
#  discarded_at                    :datetime
#  enable_optional_holidays        :boolean          default(FALSE)
#  holiday_types                   :string           default([]), is an Array
#  no_of_allowed_optional_holidays :integer
#  time_period_optional_holidays   :integer          default("per_quarter"), not null
#  year                            :integer          not null
#  created_at                      :datetime         not null
#  updated_at                      :datetime         not null
#  company_id                      :bigint           not null
#
# Indexes
#
#  index_holidays_on_company_id    (company_id)
#  index_holidays_on_discarded_at  (discarded_at)
#
# Foreign Keys
#
#  fk_rails_...  (company_id => companies.id)
#
require "rails_helper"

RSpec.describe Holiday, type: :model do
  subject { create(:holiday) }

  describe "associations" do
    it { is_expected.to belong_to(:company) }
    it { is_expected.to have_many(:holiday_infos).dependent(:destroy) }
  end

  describe "enums" do
    it {
  expect(subject).to define_enum_for(:time_period_optional_holidays).with_values(
    per_quarter: 0, per_year: 1,
    per_month: 2, per_week: 3)
}
  end

  describe "validations" do
    it { is_expected.to validate_presence_of(:year) }
    it { is_expected.to validate_uniqueness_of(:year).scoped_to(:company_id) }

    it "validates that :year is an integer" do
      expect(subject).to validate_numericality_of(:year)
        .only_integer
        .is_greater_than_or_equal_to(1900)
        .is_less_than_or_equal_to(2099)
    end
  end
end
