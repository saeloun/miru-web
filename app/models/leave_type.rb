# frozen_string_literal: true

class LeaveType < ApplicationRecord
  include Discardable
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
  has_many :carryovers

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
