# frozen_string_literal: true

class InternalApi::V1::Expenses::ExpensesSummaryController < InternalApi::V1::ApplicationController
  def index
    authorize :index, policy_class: Expenses::ExpensesSummaryPolicy
    render json: {
      expenses_summary: {
        default_categories_sum: formatted_expenses_sum(default_category_expenses),
        company_categories_sum: formatted_expenses_sum(company_expenses_categories),
        total_sum: total_expenses_sum
      }
    }
  end

  private

    def total_expenses_sum
      total_expenses = current_company.expenses.sum(:amount)
      FormatAmountService.new(current_company.base_currency, total_expenses).process
    end

    def default_category_expenses
      Expense.where(expense_category: ExpenseCategory.default_categories, company_id: current_company.id)
    end

    def company_expenses_categories
      Expense.where(expense_category: current_company.expense_categories)
    end

    def formatted_expenses_sum(expenses)
      category_expense_sum = Hash.new(0)
      expenses.each do |expense|
        category_expense_sum[expense.expense_category.name] += expense.amount
      end

      formatted_sum = {}
      category_expense_sum.each do |category, amount|
        formatted_sum[category] = FormatAmountService.new(current_company.base_currency, amount).process
      end
      formatted_sum
    end
end
