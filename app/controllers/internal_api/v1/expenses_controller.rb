# frozen_string_literal: true

class InternalApi::V1::ExpensesController < ApplicationController
  def create
    authorize :create, policy_class: ExpensePolicy
    expense = current_company.expenses.create!(expense_params)
    render :create, locals: {
      expense:,
      vendor: expense.vendor,
      expense_category: expense.expense_category
    }
  end

  private

    def expense_params
      params.require(:expense).permit(
        :amount, :date, :description, :expense_type, :expense_category_id, :vendor_id
      )
    end
end
