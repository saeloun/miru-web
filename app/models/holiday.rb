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
class Holiday < ApplicationRecord
  include Discard::Model

  enum time_period_optional_holidays: { per_quarter: 0, per_year: 1, per_month: 2, per_week: 3 }

  belongs_to :company

  has_many :holiday_infos, dependent: :destroy
  has_many :timeoff_entries, through: :holiday_infos

  validates :year, presence: true, uniqueness: { scope: :company_id }
  validates :year, numericality: { only_integer: true, greater_than_or_equal_to: 1900, less_than_or_equal_to: 2099 }

  after_discard :discard_holiday_infos

  def national_timeoff_entries
    timeoff_entries.kept.joins(:holiday_info).where(holiday_infos: { category: :national })
  end

  def optional_timeoff_entries
    timeoff_entries.kept.joins(:holiday_info).where(holiday_infos: { category: :optional })
  end

  private

    def discard_holiday_infos
      holiday_infos.discard_all
    end
end
