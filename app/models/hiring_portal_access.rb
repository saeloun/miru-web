# frozen_string_literal: true

class HiringPortalAccess < ApplicationRecord
  class Unavailable < StandardError; end
  TOKEN = /\A[1-9A-HJ-NP-Za-km-z]{32}\z/
  CLOSED_STAGES = %w[hired rejected withdrawn].freeze

  belongs_to :company
  belongs_to :hiring_application
  belongs_to :hiring_setting
  belongs_to :issued_by, class_name: "User", optional: true
  has_one :hiring_submission, dependent: :destroy
  serialize :form_schema, coder: JSON, type: Hash
  encrypts :access_token, deterministic: true
  encrypts :form_schema, :introduction
  has_secure_token :access_token, length: 32, on: :create
  self.filter_attributes += [:access_token, :form_schema, :introduction]
  audited associated_with: :company, only: [:revoked_at]

  validates :expires_at, :approved_setting_version, :introduction, presence: true
  validate :matching_tenant
  validate :fixed_invitation, on: :update

  def active?
    revoked_at.nil? && expires_at > Time.current && !CLOSED_STAGES.include?(hiring_application.reload.stage)
  end

  private

    def matching_tenant
      unless hiring_application.company_id == company_id && hiring_setting.company_id == company_id
        errors.add(:base, "Choose records from this hiring workspace")
      end
    end

    def fixed_invitation
      fields = %w[company_id hiring_application_id hiring_setting_id issued_by_id approved_setting_version
        access_token form_schema introduction expires_at]
      errors.add(:base, "Issue a new form to change its approved version") if fields.any? { |field| will_save_change_to_attribute?(field) }
    end
end
