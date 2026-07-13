# frozen_string_literal: true

class Api::V1::Cli::ExpensesController < Api::V1::Cli::BaseController
  def index
    authorize Expense

    expenses = base_scope.order(date: :desc, id: :desc)
    expenses = expenses.pg_search(params[:query]) if params[:query].present?

    render json: {
      expenses: expenses.map { |expense| Expense::ShowPresenter.new(expense).process },
      categories: ExpenseCategory::DEFAULT_CATEGORIES.map do |category|
        { name: category[:name] }
      end
    }, status: 200
  end

  def create
    authorize Expense

    expense = current_company.expenses.create!(normalized_expense_params.merge(user: current_user))
    expense.notify_submission_reviewers!

    render json: {
      notice: I18n.t("expenses.create"),
      expense: Expense::ShowPresenter.new(expense).process
    }, status: 201
  end

  private

    def base_scope
      return current_company.expenses if current_user.has_cached_role?(:owner, current_company) ||
        current_user.has_cached_role?(:admin, current_company) ||
        current_user.has_cached_role?(:book_keeper, current_company)

      current_company.expenses.where(user_id: current_user.id)
    end

    def expense_params
      params.require(:expense).permit(
        :amount,
        :date,
        :description,
        :expense_type,
        :currency,
        :category_name,
        :vendor_name
      )
    end

    def normalized_expense_params
      Expense.normalize_params(expense_params)
    end
end
