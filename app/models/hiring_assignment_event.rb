# frozen_string_literal: true

class HiringAssignmentEvent < ApplicationRecord
  belongs_to :company
  belongs_to :hiring_assignment
  belongs_to :created_by, class_name: "User", optional: true
  serialize :details, coder: JSON, type: Hash
  encrypts :details
  self.filter_attributes += [:details]
  validates :action, inclusion: { in: %w[issued submitted reviewed reassigned advanced rejection_pending revised cancelled] }
  validates :details, presence: true
  validate -> { errors.add(:base, "Choose the assessment in this workspace") unless hiring_assignment&.company_id == company_id }
  validate -> { errors.add(:base, "Assessment history cannot be rewritten") }, on: :update
end
