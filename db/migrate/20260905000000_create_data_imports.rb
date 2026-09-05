# frozen_string_literal: true

class CreateDataImports < ActiveRecord::Migration[8.1]
  def change
    create_table :data_imports do |t|
      t.references :company, null: false, foreign_key: true, index: false
      t.references :user, null: false, foreign_key: true
      t.string :source, null: false
      t.string :kind, null: false, default: "time_entries"
      t.string :status, null: false, default: "pending"
      t.boolean :dry_run, null: false, default: false
      t.jsonb :options, null: false, default: {}
      t.integer :total_rows, null: false, default: 0
      t.integer :imported_rows, null: false, default: 0
      t.integer :failed_rows, null: false, default: 0
      t.integer :skipped_rows, null: false, default: 0
      t.jsonb :summary, null: false, default: {}
      t.jsonb :row_errors, null: false, default: []
      t.text :error_message
      t.datetime :started_at
      t.datetime :finished_at

      t.timestamps
    end

    add_index :data_imports, [:company_id, :created_at]
  end
end
