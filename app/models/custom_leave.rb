# frozen_string_literal: true

class CustomLeave < ApplicationRecord
  belongs_to :leave
  has_many :custom_leave_users, dependent: :destroy
  has_many :users, through: :custom_leave_users
  has_many :timeoff_entries, dependent: :nullify

  enum :allocation_period, {
    days: 0,
    weeks: 1,
    months: 2
  }

  validates :name, :allocation_value, :allocation_period, presence: true
  validates :allocation_value, numericality: { greater_than_or_equal_to: 1 }
end
