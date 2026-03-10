# frozen_string_literal: true

class Carryover < ApplicationRecord
  include Discard::Model

  belongs_to :user
  belongs_to :company
  belongs_to :leave_type

  validates :from_year, :to_year, :total_leave_balance, :duration, presence: true
end
