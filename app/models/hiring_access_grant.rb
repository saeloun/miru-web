# frozen_string_literal: true

class HiringAccessGrant < ApplicationRecord
  belongs_to :company
  belongs_to :hiring_interview
  belongs_to :hiring_panel_member
  belongs_to :granted_by, class_name: "User", optional: true

  scope :active, -> { where(revoked_at: nil) }
  validates :compensation_access, inclusion: { in: [true, false] }
  validate :matching_tenant
  validate :fixed_grant, on: :update

  private

    def matching_tenant
      unless hiring_interview&.company_id == company_id && hiring_panel_member&.company_id == company_id
        errors.add(:base, "Choose panel and interview records in this workspace")
      end
    end

    def fixed_grant
      fixed = %w[company_id hiring_interview_id hiring_panel_member_id granted_by_id compensation_access]
      if fixed.any? { |field| will_save_change_to_attribute?(field) } || revoked_at_in_database.present?
        errors.add(:base, "Revoke the original access grant and issue a new one")
      end
    end
end
