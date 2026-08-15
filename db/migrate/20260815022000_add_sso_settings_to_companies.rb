# frozen_string_literal: true

class AddSsoSettingsToCompanies < ActiveRecord::Migration[8.1]
  def change
    add_column :companies, :sso_enforced, :boolean, null: false, default: false
    add_column :companies, :allowed_sso_domains, :string, array: true, null: false, default: []
  end
end
