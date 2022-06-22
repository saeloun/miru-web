# frozen_string_literal: true

class RemoveEmploymentDetailReferenceFromPreviousEmploymentDetails < ActiveRecord::Migration[7.0]
  def change
    remove_reference :previous_employment_details, :employment_detail, null: false, foreign_key: true
  end
end
