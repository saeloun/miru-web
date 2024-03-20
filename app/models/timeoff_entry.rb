# frozen_string_literal: true

# == Schema Information
#
# Table name: timeoff_entries
#
#  id              :bigint           not null, primary key
#  discarded_at    :datetime
#  duration        :integer          not null
#  leave_date      :date             not null
#  note            :text             default("")
#  created_at      :datetime         not null
#  updated_at      :datetime         not null
#  holiday_info_id :bigint
#  leave_type_id   :bigint
#  user_id         :bigint           not null
#
# Indexes
#
#  index_timeoff_entries_on_discarded_at     (discarded_at)
#  index_timeoff_entries_on_holiday_info_id  (holiday_info_id)
#  index_timeoff_entries_on_leave_type_id    (leave_type_id)
#  index_timeoff_entries_on_user_id          (user_id)
#
# Foreign Keys
#
#  fk_rails_...  (leave_type_id => leave_types.id)
#  fk_rails_...  (user_id => users.id)
#
class TimeoffEntry < ApplicationRecord
  include Discard::Model

  belongs_to :user
  belongs_to :leave_type, optional: true
  belongs_to :holiday_info, optional: true

  has_one :leave, through: :leave_type
  has_one :holiday, through: :holiday_info

  validates :duration, presence: true, numericality: { less_than_or_equal_to: 6000000, greater_than_or_equal_to: 0 }
  validates :leave_date, presence: true

  validate :either_leave_type_or_holiday_info_present
  validate :allow_one_holiday_per_day
  validate :optional_holiday_timeoff_entry

  scope :during, -> (from, to) { where(leave_date: from..to).order(leave_date: :desc) }

  def company
    leave&.company || holiday&.company
  end

  private

    def either_leave_type_or_holiday_info_present
      if leave_type_id.blank? && holiday_info_id.blank?
        errors.add(:base, "Either leave type or holiday info must be present")
      elsif leave_type_id.present? && holiday_info_id.present?
        errors.add(:base, "Choose either leave type or holiday info, not both")
      end
    end

    def optional_holiday_timeoff_entry
      holiday = holiday_info&.holiday
      return unless holiday_info&.category == "optional" &&
                  holiday&.no_of_allowed_optional_holidays.present?

      no_of_allowed_optional_holidays = holiday.no_of_allowed_optional_holidays
      time_period_optional_holidays = holiday.time_period_optional_holidays
      optional_timeoff_entries = holiday.optional_timeoff_entries

      error_message = "You have exceeded the maximum number of permitted optional holidays"
      case time_period_optional_holidays.to_sym
      when :per_week
        start_of_week = leave_date.beginning_of_week
        end_of_week = leave_date.end_of_week

        total_optional_entries = optional_timeoff_entries.where(
          leave_date: start_of_week..end_of_week,
          user:).count
      when :per_month
        start_of_month = leave_date.beginning_of_month
        end_of_month = leave_date.end_of_month

        total_optional_entries = optional_timeoff_entries.where(
          leave_date: start_of_month..end_of_month,
          user:).count
      when :per_quarter
        start_of_quarter = leave_date.beginning_of_quarter
        end_of_quarter = leave_date.end_of_quarter

        total_optional_entries = optional_timeoff_entries.where(
          leave_date: start_of_quarter..end_of_quarter,
          user:).count
      when :per_year
        total_optional_entries = optional_timeoff_entries.where(user:).count
      else
        errors.add(:base, error_message)
      end

      if total_optional_entries >= no_of_allowed_optional_holidays
        errors.add(:base, error_message)
      end
    end

    def allow_one_holiday_per_day
      return unless holiday_info.present?

      if holiday_info&.holiday.optional_timeoff_entries.where(leave_date:, user:).exists?
        errors.add(:base, "You are adding two holidays on the same day, please recheck")
      end
    end
end
