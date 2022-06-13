# frozen_string_literal: true

class RemoveUserFromEmploymentDetails < ActiveRecord::Migration[7.0]
  def change
    remove_reference :employment_details, :user, null: false, foreign_key: true
  end
end
