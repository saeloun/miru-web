# frozen_string_literal: true

class HiringInterviewEvent < ApplicationRecord
  belongs_to :company
  belongs_to :hiring_interview
  belongs_to :created_by, class_name: "User", optional: true
  serialize :details, coder: JSON, type: Hash
  encrypts :details
  self.filter_attributes += [:details]
  validates :action, inclusion: { in: %w[created updated reassigned completed skipped cancelled] }
  validate -> { errors.add(:base, "Choose the interview in this workspace") unless hiring_interview&.company_id == company_id }
  validate -> { errors.add(:base, "Interview history cannot be rewritten") }, on: :update
end
