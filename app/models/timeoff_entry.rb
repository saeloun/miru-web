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
end
