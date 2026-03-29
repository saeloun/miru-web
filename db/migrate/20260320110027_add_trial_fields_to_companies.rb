# frozen_string_literal: true

class AddTrialFieldsToCompanies < ActiveRecord::Migration[8.0]
  def change
    add_column :companies, :trial_started_at, :datetime
    add_column :companies, :trial_ends_at, :datetime
  end
end
