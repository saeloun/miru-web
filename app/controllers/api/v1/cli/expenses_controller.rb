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
        :category_name,
        :vendor_name
      )
    end

    def normalized_expense_params
      permitted = expense_params.to_h
      vendor_name = permitted.delete("vendor_name").to_s.strip
      category_name = permitted.delete("category_name").to_s.strip

      permitted["vendor_name"] = vendor_name if vendor_name.present?
      permitted["category_name"] = category_name if category_name.present?

      permitted
    end
end
