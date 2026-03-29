# frozen_string_literal: true

class Holiday < ApplicationRecord
  include Discard::Model

  enum :time_period_optional_holidays, { per_quarter: 0, per_year: 1, per_month: 2, per_week: 3 }

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
