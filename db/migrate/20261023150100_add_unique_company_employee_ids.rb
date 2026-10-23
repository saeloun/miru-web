# frozen_string_literal: true

class AddUniqueCompanyEmployeeIds < ActiveRecord::Migration[8.1]
  disable_ddl_transaction!

  INDEX_NAME = "index_employments_on_company_employee_id"

  def up
    duplicate_company_ids = select_values(<<~SQL)
      SELECT DISTINCT company_id
      FROM employments
      WHERE employee_id IS NOT NULL AND btrim(employee_id) <> ''
      GROUP BY company_id, employee_id
      HAVING COUNT(*) > 1
      ORDER BY company_id
    SQL
    if duplicate_company_ids.any?
      raise "Duplicate employee IDs exist in companies #{duplicate_company_ids.join(', ')}. " \
        "Resolve duplicates across all employment history, then rerun this migration."
    end

    index = connection.indexes(:employments).find { |item| item.name == INDEX_NAME }
    if index&.valid?
      # pg_get_expr adds varchar casts and parentheses to the stored predicate.
      expected_predicate = "((employee_id IS NOT NULL) AND (btrim((employee_id)::text) <> ''::text))"
      unless index.unique && index.columns == %w[company_id employee_id] && index.where == expected_predicate
        raise "#{INDEX_NAME} has a conflicting definition; inspect it before retrying this migration."
      end
      return
    end
    remove_index :employments, name: INDEX_NAME, algorithm: :concurrently if index

    add_index :employments, [:company_id, :employee_id], unique: true,
      where: "employee_id IS NOT NULL AND btrim(employee_id) <> ''",
      name: INDEX_NAME, algorithm: :concurrently
  end

  def down
    remove_index :employments, name: INDEX_NAME, algorithm: :concurrently
  end
end
