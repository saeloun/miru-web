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
    scoped_expenses = search_expenses.includes(:company)
    @expenses = paginated_expenses(scoped_expenses)

    {
      expenses:,
      pagination_details: pagination_details(scoped_expenses.count),
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

      expenses.order(created_at: :desc)
    end

    def base_scope
      expenses = current_company.expenses.kept

      return expenses if current_user.has_cached_role?(:owner, current_company) ||
        current_user.has_cached_role?(:admin, current_company) ||
        current_user.has_cached_role?(:book_keeper, current_company)

      expenses.where(user_id: current_user.id)
    end

    def current_page
      parsed_page = (params[:page] || 1).to_i
      parsed_page <= 0 ? 1 : parsed_page
    end

    def per_page
      parsed_per_page = (params[:expenses_per_page] || params[:per] || 25).to_i
      return 25 if parsed_per_page <= 0
      return 100 if parsed_per_page > 100

      parsed_per_page
    end

    def paginated_expenses(expenses)
      expenses.limit(per_page).offset((current_page - 1) * per_page)
    end

    def pagination_details(total_count)
      total_pages = [(total_count.to_f / per_page).ceil, 1].max

      {
        pages: total_pages,
        first: current_page == 1,
        prev: current_page > 1 ? current_page - 1 : nil,
        next: current_page < total_pages ? current_page + 1 : nil,
        last: current_page >= total_pages,
        page: current_page,
        total: total_count
      }
    end

    def expense_categories
      ExpenseCategory::DEFAULT_CATEGORIES.map do |category|
        { name: category[:name] }
      end
    end
end
