# frozen_string_literal: true

class Expense::ShowPresenter
  attr_reader :expense

  def initialize(expense)
    @expense = expense
  end

  def process
    {
      id: expense.id,
      vendor_name: expense.vendor&.name,
      category_name: expense.expense_category.name,
      amount: expense.amount,
      date: expense.formatted_date,
      description: expense.description,
      type: expense.expense_type,
      receipts: expense.attached_receipts_urls
    }
  end
end
