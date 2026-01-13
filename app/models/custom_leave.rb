# frozen_string_literal: true

# == Schema Information
#
# Table name: custom_leaves
#
#  id                :bigint           not null, primary key
#  allocation_period :integer          not null
#  allocation_value  :integer          not null
#  name              :string           not null
#  created_at        :datetime         not null
#  updated_at        :datetime         not null
#  leave_id          :bigint           not null
#
# Indexes
#
#  index_custom_leaves_on_leave_id  (leave_id)
#
# Foreign Keys
#
#  fk_rails_...  (leave_id => leaves.id)
#
class CustomLeave < ApplicationRecord
  belongs_to :leave
  has_many :custom_leave_users, dependent: :destroy
  has_many :users, through: :custom_leave_users
  has_many :timeoff_entries, dependent: :nullify

  enum allocation_period: {
    days: 0,
    weeks: 1,
    months: 2
  }

  validates :name, :allocation_value, :allocation_period, presence: true
  validates :allocation_value, numericality: { greater_than_or_equal_to: 1 }
end
