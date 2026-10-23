# frozen_string_literal: true

class CompensationReportRun < ApplicationRecord
  belongs_to :company
  belongs_to :created_by, class_name: "User"
  serialize :payload, coder: JSON, type: Hash
  encrypts :payload
  audited associated_with: :company, only: [:company_id, :created_by_id, :expires_at]
  validates :expires_at, presence: true
end
