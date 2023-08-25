# frozen_string_literal: true

# == Schema Information
#
# Table name: holidays
#
#  id                              :bigint           not null, primary key
#  enable_optional_holidays        :boolean          default(FALSE)
#  holiday_types                   :string           default([]), is an Array
#  no_of_allowed_optional_holidays :integer
#  time_period_optional_holidays   :string           default("per_quarter")
#  year                            :integer          not null
#  created_at                      :datetime         not null
#  updated_at                      :datetime         not null
#
class Holiday < ApplicationRecord
  has_many :holiday_infos, dependent: :destroy
  enum time_period_optional_holidays: { per_quarter: "per_quarter", per_year: "per_year" }
  validates :year, presence: true
end
