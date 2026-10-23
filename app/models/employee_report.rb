# frozen_string_literal: true

class EmployeeReport < ApplicationRecord
  belongs_to :company
  audited associated_with: :company, only: [:company_id]

  validates :name, presence: true, length: { maximum: 100 }
  validate :permitted_columns

  private

    def permitted_columns
      unless columns.is_a?(Array) && columns.present? && columns.uniq == columns &&
          (columns - EmployeeReports::Columns::DEFINITIONS.keys).empty?
        errors.add(:columns, "must be a nonempty, unique selection of permitted columns")
      end
    end
end
