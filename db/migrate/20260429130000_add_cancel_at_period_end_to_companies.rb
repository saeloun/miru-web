# frozen_string_literal: true

class AddCancelAtPeriodEndToCompanies < ActiveRecord::Migration[8.0]
  def change
    add_column :companies, :cancel_at_period_end, :boolean, default: false, null: false
  end
end
