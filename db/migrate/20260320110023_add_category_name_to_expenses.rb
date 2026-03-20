# frozen_string_literal: true

class AddCategoryNameToExpenses < ActiveRecord::Migration[8.0]
  def up
    add_column :expenses, :category_name, :string

    safety_assured do
      execute <<~SQL
        UPDATE expenses
        SET category_name = expense_categories.name
        FROM expense_categories
        WHERE expenses.expense_category_id = expense_categories.id
          AND expenses.category_name IS NULL
      SQL
    end
  end

  def down
    remove_column :expenses, :category_name
  end
end
