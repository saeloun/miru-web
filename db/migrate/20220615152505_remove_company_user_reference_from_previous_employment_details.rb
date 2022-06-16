# frozen_string_literal: true

class RemoveCompanyUserReferenceFromPreviousEmploymentDetails < ActiveRecord::Migration[7.0]
  def change
    remove_reference :previous_employment_details, :company_user, null: false, foreign_key: true
  end
end
