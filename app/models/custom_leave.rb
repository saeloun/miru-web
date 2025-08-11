# frozen_string_literal: true

# == Schema Information
#
# Table name: custom_leaves
#
#  id                :integer          not null, primary key
#  name              :string           not null
#  allocation_value  :integer          not null
#  allocation_period :integer          not null
#  leave_id          :integer          not null
#  created_at        :datetime         not null
#  updated_at        :datetime         not null
#
# Indexes
#
#  index_custom_leaves_on_leave_id  (leave_id)
#

class CustomLeave < ApplicationRecord
  belongs_to :leave
  has_many :custom_leave_users, dependent: :destroy
  has_many :users, through: :custom_leave_users

  enum :allocation_period, {
    days: 0,
    weeks: 1,
    months: 2
  }

  validates :name, :allocation_value, :allocation_period, presence: true
  validates :allocation_value, numericality: { greater_than_or_equal_to: 1 }
end
