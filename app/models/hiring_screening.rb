# frozen_string_literal: true

class HiringScreening < ApplicationRecord
  STAGES = { "update_details" => nil, "shortlist" => "shortlisted", "request_information" => "information_pending",
             "interview" => "interview", "reject" => "rejection_pending" }.freeze

  belongs_to :company
  belongs_to :hiring_application
  belongs_to :created_by, class_name: "User", optional: true
  serialize :details, coder: JSON, type: Hash
  encrypts :details

  validates :action, inclusion: { in: STAGES.keys }
  validates :from_stage, :to_stage, inclusion: { in: HiringApplication::STAGES }
  validates :application_version, numericality: { only_integer: true, greater_than: 0 }
  validates :details, presence: true
  validate :matching_application
  validate -> { errors.add(:base, "Screening history cannot be rewritten") }, on: :update

  def review_details
    slice(:id, :action, :from_stage, :to_stage, :application_version, :created_at).merge(details:)
  end

  private

    def matching_application
      errors.add(:base, "Choose an application in this workspace") unless hiring_application&.company_id == company_id
    end
end
