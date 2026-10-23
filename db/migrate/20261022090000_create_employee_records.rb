# frozen_string_literal: true

class CreateEmployeeRecords < ActiveRecord::Migration[8.1]
  def change
    create_table :employee_records do |t|
      t.references :employment, null: false, foreign_key: true, index: { unique: true }
      t.text :private_details, null: false
      t.timestamps
    end

    create_table :employee_documents do |t|
      t.references :employment, null: false, foreign_key: true
      t.references :uploaded_by, null: false, foreign_key: { to_table: :users }
      t.string :kind, null: false
      t.timestamps
    end
    add_check_constraint :employee_documents, "kind IN ('pan', 'contract')", name: "employee_documents_kind"

    create_table :employee_payments do |t|
      t.references :employment, null: false, foreign_key: true
      t.references :created_by, null: false, foreign_key: { to_table: :users }
      t.date :paid_on, null: false
      t.decimal :amount, precision: 12, scale: 2, null: false
      t.string :currency, null: false
      t.string :reference, null: false
      t.text :note
      t.timestamps
    end
    add_index :employee_payments, [:employment_id, :reference], unique: true
    add_index :employee_payments, [:employment_id, :paid_on, :id]
    add_check_constraint :employee_payments, "amount > 0", name: "employee_payments_positive_amount"
  end
end
