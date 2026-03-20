# frozen_string_literal: true

class MakeExpenseCategoryOptionalOnExpenses < ActiveRecord::Migration[8.0]
  def change
    change_column_null :expenses, :expense_category_id, true
  end
end
