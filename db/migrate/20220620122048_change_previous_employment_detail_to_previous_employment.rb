# frozen_string_literal: true

class ChangePreviousEmploymentDetailToPreviousEmployment < ActiveRecord::Migration[7.0]
  def change
    rename_table :previous_employment_details, :previous_employments
  end
end
