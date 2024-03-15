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

      Expense.search(
        filters.search_term,
        fields: [:category_name, :vendor_name, :description],
        match: :word_start,
        where: filters.where_clause,
        order: { created_at: :desc },
        page: filters.page,
        per_page: filters.per_page
      )
    end

    def pagination_details
      {
        pages: expenses.total_pages,
        first: expenses.first_page?,
        prev: expenses.prev_page,
        next: expenses.next_page,
        last: expenses.last_page?
      }
    end
end
