# frozen_string_literal: true

class AddDefaultExpenseCategories < ActiveRecord::Migration[7.0]
  def change
    ExpenseCategory.transaction do
      ExpenseCategory::DEFAULT_CATEGORIES.each do |category|
        ExpenseCategory.create!(category)
      end

      puts "Default categories created!"
    end
  end
end
