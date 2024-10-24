# frozen_string_literal: true

class BankAccount < ApplicationRecord
  belongs_to :company

  validates :routing_number, presence: true
  validates :account_number, presence: true
  validates :account_type, presence: true, inclusion: { in: %w[checking savings] }
  validates :bank_name, presence: true
end
