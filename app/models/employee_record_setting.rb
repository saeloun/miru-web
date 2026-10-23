# frozen_string_literal: true

class EmployeeRecordSetting < ApplicationRecord
  belongs_to :company
  audited associated_with: :company, only: [:company_id, :occasion_reminders_enabled]
  validates :company_id, uniqueness: true
  validates :occasion_reminders_enabled, inclusion: { in: [true, false] }
end
