# frozen_string_literal: true

class RemoveOfficialEmailIdFromEmploymentDetails < ActiveRecord::Migration[7.0]
  def change
    remove_column :employment_details, :official_email_id, :string
  end
end
