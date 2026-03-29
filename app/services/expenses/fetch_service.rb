# frozen_string_literal: true

class Expenses::FetchService
  attr_reader :params, :current_company, :current_user
  attr_accessor :expenses

  def initialize(current_company, current_user, params)
    @params = params
    @current_company = current_company
    @current_user = current_user
  end

  def process
    @expenses = search_expenses.includes(:company)

    {
      expenses:,
      pagination_details:,
      categories: expense_categories
    }
  end

  private

    def search_expenses
      filters = Expenses::FiltersService.new(current_company, params)
      filters.process

      expenses = base_scope

      # Apply search if present
      if filters.search_term.present?
        expenses = expenses.search(filters.search_term)
      end

      # Apply filters from where_clause
      if filters.where_clause.present?
        # Apply date range filter if present
        if filters.where_clause[:date].present?
          expenses = expenses.where(date: filters.where_clause[:date])
        end

        # Apply expense_type filter if present
        if filters.where_clause[:expense_type].present?
          expenses = expenses.where(expense_type: filters.where_clause[:expense_type])
        end

      end

      # Apply ordering
      expenses = expenses.order(created_at: :desc)

      # Apply pagination using simple offset/limit
      page = (filters.page || 1).to_i
      page = 1 if page <= 0
      per_page = (filters.per_page || 10).to_i
      per_page = 10 if per_page <= 0
      expenses = expenses.limit(per_page).offset((page - 1) * per_page)

      expenses
    end

    def base_scope
      expenses = current_company.expenses.kept

      return expenses if current_user.has_cached_role?(:owner, current_company) ||
        current_user.has_cached_role?(:admin, current_company) ||
        current_user.has_cached_role?(:book_keeper, current_company)

      expenses.where(user_id: current_user.id)
    end

    def pagination_details
      # Simplified pagination for compatibility
      # Since we're using Pagy in controllers, not here
      {
        pages: 1,
        first: true,
        prev: nil,
        next: nil,
        last: true
      }
    end

    def expense_categories
      ExpenseCategory::DEFAULT_CATEGORIES.map do |category|
        { name: category[:name] }
      end
    end
end
