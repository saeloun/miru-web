# frozen_string_literal: true

class ExpensePresenter
  attr_reader :expense

  def initialize(expense)
    @expense = expense
  end

  def snippet
    {
      id: expense.id,
      vendor_name: expense.vendor&.name,
      category_name: expense.expense_category.name,
      amount: expense.amount,
      date: expense.date,
      description: expense.description,
      type: expense.expense_type,
      receipts: expense.attached_receipts
    }
  end
end
