# frozen_string_literal: true

# == Schema Information
#
# Table name: carryovers
#
#  id                  :integer          not null, primary key
#  user_id             :integer          not null
#  company_id          :integer          not null
#  leave_type_id       :integer          not null
#  from_year           :integer
#  to_year             :integer
#  total_leave_balance :integer
#  duration            :integer
#  discarded_at        :datetime
#  created_at          :datetime         not null
#  updated_at          :datetime         not null
#
# Indexes
#
#  index_carryovers_on_company_id     (company_id)
#  index_carryovers_on_discarded_at   (discarded_at)
#  index_carryovers_on_leave_type_id  (leave_type_id)
#  index_carryovers_on_user_id        (user_id)
#

class Carryover < ApplicationRecord
  include Discard::Model

  belongs_to :user
  belongs_to :company
  belongs_to :leave_type

  validates :from_year, :to_year, :total_leave_balance, :duration, presence: true
end
