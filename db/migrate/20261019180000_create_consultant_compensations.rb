# frozen_string_literal: true

class CreateConsultantCompensations < ActiveRecord::Migration[8.1]
  def change
    create_table :consultant_compensations do |t|
      t.references :employment, null: false, foreign_key: true
      t.references :created_by, null: false, foreign_key: { to_table: :users }
      t.date :effective_on, null: false
      t.decimal :monthly_fee, precision: 12, scale: 2, null: false
      t.decimal :hours_per_day, precision: 4, scale: 2, null: false
      t.integer :weekdays, array: true, null: false
      t.string :payment_source, null: false
      t.string :legal_entity_name, null: false
      t.text :change_reason, null: false
      t.timestamps
    end
    add_index :consultant_compensations, [:employment_id, :effective_on, :id], name: "index_consultant_terms_effective_version"
    add_check_constraint :consultant_compensations, "monthly_fee > 0 AND hours_per_day > 0 AND hours_per_day <= 24",
      name: "consultant_compensations_positive_terms"
    add_column :expenses, :approved_at, :datetime
  end
end
