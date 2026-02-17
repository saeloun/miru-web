# frozen_string_literal: true

class Expenses::FiltersService < ApplicationService
  attr_reader :current_company, :where_clause, :params

  def initialize(current_company, params)
    @current_company = current_company
    @params = params
    @where_clause = {}
  end

  def process
    process_page_params
    add_default_filters
  end

  def search_term
    params[:query].presence || "*"
  end

  def page
    params[:page]
  end

  def per_page
    return nil if params[:expenses_per_page] <= 0

    params[:expenses_per_page]
  end

  private

    def process_page_params
      params[:page] = params[:page].to_i
      params[:expenses_per_page] = params[:expenses_per_page].to_i
    end

    def add_default_filters
      @where_clause[:company_id] = current_company.id
      # Expense model doesn't use soft delete (discard)
    end
end
