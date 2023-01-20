# frozen_string_literal: true

class InternalApi::V1::ExpensesController < ApplicationController
  def create
    authorize Expense
    expense = current_company.expenses.create!(expense_params)
    render :create, locals: {
      expense: ExpensePresenter.new(expense).snippet
    }
  end

  def show
    authorize expense
    render :show, locals: {
      expense: ExpensePresenter.new(expense).snippet
    }
  end

  private

    def expense
      @_expense ||= Expense.find(params[:id])
    end

    def expense_params
      params.require(:expense).permit(
        :amount, :date, :description, :expense_type, :expense_category_id, :vendor_id
      )
    end
end
