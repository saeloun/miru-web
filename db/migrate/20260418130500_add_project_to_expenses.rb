# frozen_string_literal: true

class AddProjectToExpenses < ActiveRecord::Migration[7.1]
  disable_ddl_transaction!

  def change
    add_column :expenses, :project_id, :bigint
    add_index :expenses, :project_id, algorithm: :concurrently
    add_index :expenses, [:company_id, :date, :project_id],
      algorithm: :concurrently,
      name: "index_expenses_on_company_date_project"
    add_foreign_key :expenses, :projects, validate: false
    validate_foreign_key :expenses, :projects
  end
end
