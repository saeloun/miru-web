# frozen_string_literal: true

# == Schema Information
#
# Table name: leave_types
#
#  id                   :bigint           not null, primary key
#  allocation_frequency :integer          not null
#  allocation_period    :integer          not null
#  allocation_value     :integer          not null
#  carry_forward_days   :integer          default(0), not null
#  color                :integer          not null
#  discarded_at         :datetime
#  icon                 :integer          not null
#  name                 :string           not null
#  created_at           :datetime         not null
#  updated_at           :datetime         not null
#  leave_id             :bigint           not null
#
# Indexes
#
#  index_leave_types_on_color_and_leave_id  (color,leave_id) UNIQUE
#  index_leave_types_on_discarded_at        (discarded_at)
#  index_leave_types_on_icon_and_leave_id   (icon,leave_id) UNIQUE
#  index_leave_types_on_leave_id            (leave_id)
#
# Foreign Keys
#
#  fk_rails_...  (leave_id => leaves.id)
#
class LeaveType < ApplicationRecord
  include Discard::Model
  include LeaveTypeValidatable

  enum :color, {
    chart_blue: 0,
    chart_pink: 1,
    chart_orange: 2,
    chart_green: 3,
    chart_purple: 4,
    chart_light_blue: 5,
    chart_light_pink: 6,
    chart_light_green: 7
  }

  enum :icon, {
    calendar: 0,
    cake: 1,
    vacation: 2,
    medicine: 3,
    baby: 4,
    flower: 5,
    car: 6,
    user: 7
  }

  enum :allocation_period, {
    days: 0,
    weeks: 1,
    months: 2
  }

  enum :allocation_frequency, {
    per_week: 0,
    per_month: 1,
    per_quarter: 2,
    per_year: 3
  }

  belongs_to :leave, class_name: "Leave"

  has_many :timeoff_entries, dependent: :destroy

  validates :name, presence: true, format: { with: /\A[a-zA-Z\s]+\z/ }, length: { maximum: 20 }
  validates :color, presence: true, uniqueness: { scope: :leave_id, message: "has already been taken for this leave" }
  validates :icon, presence: true, uniqueness: { scope: :leave_id, message: "has already been taken for this leave" }
  validates :allocation_value, presence: true, numericality: { greater_than_or_equal_to: 1 }
  validates :allocation_period, :allocation_frequency, presence: true
  validates :carry_forward_days, presence: true

  after_discard :discard_timeoff_entries

  private

    def discard_timeoff_entries
      timeoff_entries.discard_all
    end
end
