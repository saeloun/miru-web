# frozen_string_literal: true

class Expense::ShowPresenter
  attr_reader :expense

  def initialize(expense)
    @expense = expense
  end

  def process
    {
      id: expense.id,
      vendor_name: expense.display_vendor_name,
      category_name: expense.display_category_name,
      amount: expense.amount,
      date: expense.formatted_date,
      description: expense.description,
      type: expense.expense_type,
      receipts: expense.attached_receipts_urls,
      status: expense.status,
      paid_at: expense.paid_at,
      submitter_name: expense.submitter_name
    }
  end
end
