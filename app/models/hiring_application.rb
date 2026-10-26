# frozen_string_literal: true

class HiringApplication < ApplicationRecord
  STAGES = %w[received information_pending screening shortlisted assignment_assigned assignment_review interview
    final_decision offer hired on_hold rejection_pending rejected withdrawn no_show].freeze
  CREATION_FIELDS = %w[company_id hiring_candidate_id request_key creation_details source received_at created_by_id email_key].freeze

  belongs_to :company
  belongs_to :hiring_candidate
  belongs_to :hiring_role, optional: true
  belongs_to :owner_employment, class_name: "Employment", optional: true
  belongs_to :created_by, class_name: "User", optional: true
  has_many :hiring_assignments, dependent: :destroy
  has_many :hiring_portal_accesses, dependent: :destroy
  has_many :hiring_submissions, dependent: :destroy
  has_many :hiring_screenings, dependent: :destroy
  serialize :creation_details, coder: JSON, type: Hash
  encrypts :creation_details, :notes
  audited associated_with: :company, on: :update, only: [:stage, :hiring_role_id, :owner_employment_id]

  validates :request_key, :received_at, presence: true
  validates :stage, inclusion: { in: STAGES }
  validates :source, inclusion: { in: %w[manual email] }
  validates :notes, length: { maximum: 10_000 }, allow_nil: true
  validate :matching_tenant
  validate :immutable_creation, on: :update

  def submitted_name = creation_details["full_name"]

  private

    def matching_tenant
      [hiring_candidate, hiring_role, owner_employment].compact.each do |record|
        errors.add(:base, "Choose records from this hiring workspace") unless record.company_id == company_id
      end
    end

    def immutable_creation
      errors.add(:base, "The original application cannot be changed") if CREATION_FIELDS.any? { |field| will_save_change_to_attribute?(field) }
    end
end
