# frozen_string_literal: true

class Expenses::FetchService
  attr_reader :params, :current_company
  attr_accessor :expenses

  def initialize(current_company, params)
    @params = params
    @current_company = current_company
  end

  def process
    @expenses = search_expenses.includes(:expense_category, :vendor, :company)

    {
      expenses:,
      pagination_details:,
      vendors: current_company.vendors,
      categories: current_company.all_expense_categories
    }
  end

  private

    def search_expenses
      filters = Expenses::FiltersService.new(current_company, params)
      filters.process

      expenses = current_company.expenses

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

        # Apply category filter if present
        if filters.where_clause[:expense_category_id].present?
          expenses = expenses.where(expense_category_id: filters.where_clause[:expense_category_id])
        end

        # Apply vendor filter if present
        if filters.where_clause[:vendor_id].present?
          expenses = expenses.where(vendor_id: filters.where_clause[:vendor_id])
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
end
