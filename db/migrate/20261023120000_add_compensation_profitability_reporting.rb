# frozen_string_literal: true

class AddCompensationProfitabilityReporting < ActiveRecord::Migration[8.0]
  def change
    add_column :companies, :compensation_proration, :string

    create_table :compensation_report_runs do |t|
      t.references :company, null: false, foreign_key: true
      t.references :created_by, null: false, foreign_key: { to_table: :users }
      t.text :payload, null: false
      t.datetime :expires_at, null: false
      t.timestamps
    end

    create_table :compensation_versions do |t|
      t.references :employment, null: false, foreign_key: true
      t.date :effective_on, null: false
      t.text :salary_details, null: false
      t.timestamps
    end
    add_index :compensation_versions, [:employment_id, :effective_on, :id], name: :index_compensation_versions_effective

    create_table :profitability_profiles do |t|
      t.references :employment, null: false, foreign_key: true, index: { unique: true }
      t.references :primary_project, foreign_key: { to_table: :projects }
      t.string :department
      t.integer :weekdays, array: true, null: false, default: []
      t.decimal :hours_per_day, precision: 4, scale: 2
      t.timestamps
    end

    create_table :profitability_billing_rates do |t|
      t.references :project, null: false, foreign_key: true
      t.references :user, null: false, foreign_key: true
      t.date :effective_on, null: false
      t.decimal :hourly_rate, precision: 14, scale: 4
      t.string :currency, null: false
      t.string :billing_method, null: false, default: "hourly"
      t.timestamps
    end
    add_index :profitability_billing_rates, [:project_id, :user_id, :effective_on], name: :index_profitability_rates_effective
    add_check_constraint :profitability_billing_rates,
      "(billing_method = 'hourly' AND hourly_rate >= 0) OR (billing_method = 'fixed_fee' AND hourly_rate IS NULL)",
      name: :profitability_valid_billing_rate
  end
end
