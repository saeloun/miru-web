# frozen_string_literal: true

class AddSignatureEnabledToClients < ActiveRecord::Migration[8.1]
  def change
    add_column :clients, :signature_enabled, :boolean, default: false, null: false
  end
end
