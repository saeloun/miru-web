# frozen_string_literal: true

class PayrollIndiaCredit < ApplicationRecord
  self.filter_attributes += [:reference, :reference_digest]
  encrypts :reference
  belongs_to :company
  belongs_to :payroll_india_handoff
  belongs_to :actor, class_name: "User"
  validates :amount_minor, numericality: { only_integer: true, greater_than: 0 }
  validates :credited_on, :reference, :reference_digest, presence: true

  def readonly?
    persisted?
  end

  def serializable_hash(options = nil)
    super.except("reference", "reference_digest")
  end
end
