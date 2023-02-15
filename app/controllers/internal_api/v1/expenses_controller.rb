# frozen_string_literal: true

class InternalApi::V1::ExpensesController < ApplicationController
  def index
    authorize Expense

    expenses = Expenses::FetchService.new(current_company, params).process

    render :index, locals: expenses
  end

  def create
    authorize Expense

    expense = current_company.expenses.create!(expense_params)

    render :create, locals: {
      expense: ExpensePresenter.new(expense).snippet
    }
  end

  def show
    authorize expense

    formatted_expense = Expense::ShowPresenter.new(expense).process

    render :show, locals: { expense: formatted_expense }
  end

  private

    def expense
      @_expense ||= Expense.find(params[:id])
    end

    def expense_params
      params.require(:expense).permit(
        :amount, :date, :description, :expense_type, :expense_category_id, :vendor_id, :receipts
      )
    end
end
