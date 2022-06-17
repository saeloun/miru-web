# frozen_string_literal: true

class AddUserReferenceToPreviousEmploymentDetails < ActiveRecord::Migration[7.0]
  def change
    add_reference :previous_employment_details, :user, null: false, foreign_key: true
  end
end
