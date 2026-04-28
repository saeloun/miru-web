# frozen_string_literal: true

class AddSettingsToPaymentsProviders < ActiveRecord::Migration[8.1]
  def change
    add_column :payments_providers, :settings, :jsonb, null: false, default: {}
  end
end
