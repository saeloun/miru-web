# frozen_string_literal: true

class HiringAssignment < ApplicationRecord
  class Unavailable < StandardError; end
  ACTIVE_STAGES = %w[assignment_assigned assignment_review].freeze
  STATUSES = %w[issued submitted reviewed completed cancelled superseded].freeze

  belongs_to :company
  belongs_to :hiring_application
  belongs_to :template_revision, class_name: "HiringAssignmentTemplateRevision"
  belongs_to :reviewer_employment, class_name: "Employment", optional: true
  belongs_to :issued_by, class_name: "User", optional: true
  belongs_to :previous_assignment, class_name: "HiringAssignment", optional: true
  has_many :reviews, class_name: "HiringAssignmentReview", dependent: :destroy
  has_many :events, class_name: "HiringAssignmentEvent", dependent: :destroy
  has_one :submission, class_name: "HiringAssignmentSubmission", dependent: :destroy
  serialize :terms, coder: JSON, type: Hash
  serialize :request_details, coder: JSON, type: Hash
  encrypts :terms, :request_details, :candidate_note
  encrypts :access_token, deterministic: true
  has_secure_token :access_token, length: 32, on: :create
  self.filter_attributes += [:terms, :request_details, :candidate_note, :access_token]

  validates :due_at, :terms, :request_details, presence: true
  validates :status, inclusion: { in: STATUSES }
  validates :review_round, numericality: { only_integer: true, greater_than_or_equal_to: 0 }
  validate :matching_tenant
  validate :fixed_terms, on: :update

  def active?
    reload
    ended_at.nil? && ACTIVE_STAGES.include?(hiring_application.reload.stage)
  end

  def candidate_access?(token)
    token.is_a?(String) && token.match?(HiringPortalAccess::TOKEN) && active? && due_at > Time.current &&
      ActiveSupport::SecurityUtils.secure_compare(access_token, token)
  end

  def current_review = reviews.where(review_round:).order(id: :desc).first

  def candidate_details
    { title: terms.fetch("title"), role: terms["role"]&.fetch("title"), template_version: terms.fetch("lock_version"),
      details: terms.fetch("details").slice(*HiringAssignmentTemplate::DETAIL_KEYS), candidate_note:, due_at:, status:,
      lock_version:, submission: submission.candidate_details }
  end

  def record_event!(action, actor:, details: {})
    events.create!(company:, created_by: actor, action:, assignment_version: lock_version,
      details: details.merge("actor_name" => actor&.full_name || "Candidate"))
  end

  def review_details
    candidate_details.except(:submission).merge(id:, application_version: hiring_application.lock_version,
      application_stage: hiring_application.stage,
      candidate_name: hiring_application.submitted_name,
      submission: submission.submitted_at? ? submission.candidate_details.merge(id: submission.id) : nil,
      current_review_id: current_review&.id,
      reviews: reviews.order(id: :desc).map do |review|
        review.slice(:id, :outcome, :review_round, :assignment_version, :created_at).merge(details: review.details)
      end)
  end

  def cancel_for_stage!(actor:)
    with_lock do
      return if ended_at?

      update!(status: "cancelled", ended_at: Time.current)
      record_event!("cancelled", actor:, details: { "reason" => "Application moved to #{hiring_application.stage}" })
    end
  end

  private

    def matching_tenant
      records = [hiring_application, template_revision, reviewer_employment, previous_assignment].compact
      errors.add(:base, "Choose assessment records in this workspace") if records.any? { |record| record.company_id != company_id }
      if previous_assignment && previous_assignment.hiring_application_id != hiring_application_id
        errors.add(:base, "Revised work must belong to the same application")
      end
    end

    def fixed_terms
      fields = %w[company_id hiring_application_id template_revision_id issued_by_id previous_assignment_id request_key request_details terms candidate_note access_token due_at]
      errors.add(:base, "Issue a new assignment to change its terms or deadline") if fields.any? { |field| will_save_change_to_attribute?(field) }
    end
end
