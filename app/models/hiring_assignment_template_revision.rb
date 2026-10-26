# frozen_string_literal: true

class HiringAssignmentTemplateRevision < ApplicationRecord
  belongs_to :company
  belongs_to :hiring_assignment_template
  belongs_to :created_by, class_name: "User", optional: true
  serialize :snapshot, coder: JSON, type: Hash
  encrypts :snapshot
  self.filter_attributes += [:snapshot]
  validates :snapshot, presence: true
  validates :template_version, numericality: { only_integer: true, greater_than_or_equal_to: 0 }
  validate :matching_template
  validate -> { errors.add(:base, "Task revision history cannot be rewritten") }, on: :update

  def review_details = slice(:id, :template_version, :created_at).merge(snapshot:)

  private

    def matching_template
      errors.add(:base, "Choose a task in this workspace") unless hiring_assignment_template&.company_id == company_id
    end
end
