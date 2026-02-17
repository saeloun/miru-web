# frozen_string_literal: true

class Api::V1::ExpenseCategoriesController < ApplicationController
  def create
    authorize :create, policy_class: ExpenseCategoryPolicy

    expense_category = current_company.expense_categories.create!(expense_category_params)

    render :create, locals: {
      expense_category:
    }
  end

  private

    def expense_category_params
      params.require(:expense_category).permit(:name)
    end
end
