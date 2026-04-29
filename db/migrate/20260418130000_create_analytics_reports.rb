# frozen_string_literal: true

class CreateAnalyticsReports < ActiveRecord::Migration[7.1]
  def change
    create_table :analytics_reports do |t|
      t.references :company, null: false, foreign_key: true
      t.references :created_by, null: false, foreign_key: { to_table: :users }
      t.string :name, null: false
      t.integer :report_type, null: false
      t.jsonb :filters, null: false, default: {}

      t.timestamps
    end

    add_index :analytics_reports, [:company_id, :report_type, :created_at],
      name: "index_analytics_reports_on_company_report_type_created_at"
    add_index :analytics_reports, :filters, using: :gin
  end
end
