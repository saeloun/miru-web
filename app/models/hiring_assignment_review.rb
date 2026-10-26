# frozen_string_literal: true

class HiringAssignmentReview < ApplicationRecord
  DIMENSIONS = %w[correctness code_quality testing maintainability problem_solving understanding].freeze
  OUTCOMES = %w[pass fail clarification_required].freeze
  REQUEST_KINDS = %w[none walkthrough follow_up revised_submission].freeze

  belongs_to :company
  belongs_to :hiring_assignment
  belongs_to :submission, class_name: "HiringAssignmentSubmission"
  belongs_to :created_by, class_name: "User", optional: true
  serialize :details, coder: JSON, type: Hash
  encrypts :details
  self.filter_attributes += [:details]
  validates :outcome, inclusion: { in: OUTCOMES }
  validates :details, presence: true
  validate :matching_submission
  validate -> { errors.add(:base, "Assessment review history cannot be rewritten") }, on: :update

  private

    def matching_submission
      unless hiring_assignment&.company_id == company_id && submission&.company_id == company_id && submission.hiring_assignment_id == hiring_assignment_id
        errors.add(:base, "Choose the submission for this assessment")
      end
    end
end
