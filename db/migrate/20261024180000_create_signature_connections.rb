# frozen_string_literal: true

class CreateSignatureConnections < ActiveRecord::Migration[8.1]
  def change
    create_table :signature_connections do |t|
      t.references :company, null: false, foreign_key: true
      t.references :created_by, null: false, foreign_key: { to_table: :users }
      t.text :api_key, null: false
      t.string :provider_origin, null: false, limit: 500
      t.datetime :disabled_at
      t.timestamps
    end
    add_index :signature_connections, :company_id, unique: true, where: "disabled_at IS NULL",
      name: "index_signature_connections_active_company"
  end
end
