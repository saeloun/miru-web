# frozen_string_literal: true

class Api::V1::Cli::ExpensesController < Api::V1::Cli::BaseController
  def index
    authorize Expense

    expenses = base_scope.includes(:expense_category, :vendor).order(date: :desc, id: :desc)
    expenses = expenses.pg_search(params[:query]) if params[:query].present?

    render json: {
      expenses: expenses.map { |expense| Expense::ShowPresenter.new(expense).process },
      vendors: current_company.vendors.order(:name).map { |vendor| { id: vendor.id, name: vendor.name } },
      categories: current_company.expense_categories.order(:name).map do |category|
        { id: category.id, name: category.name, default: category.default }
      end
    }, status: 200
  end

  def create
    authorize Expense

    expense = current_company.expenses.create!(expense_params.merge(user: current_user))

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
      params.require(:expense).permit(:amount, :date, :description, :expense_type, :expense_category_id, :vendor_id)
    end
end
