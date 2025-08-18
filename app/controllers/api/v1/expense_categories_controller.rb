# frozen_string_literal: true

class Api::V1::ExpenseCategoriesController < Api::V1::BaseController
  before_action :set_expense_category, only: [:show, :update, :destroy]
  after_action :verify_authorized, except: [:index]

  def index
    expense_categories = current_company.expense_categories.kept.order(:name)
    render json: { expense_categories: expense_categories }, status: 200
  end

  def show
    authorize @expense_category
    render json: { expense_category: @expense_category }, status: 200
  end

  def create
    @expense_category = current_company.expense_categories.build(expense_category_params)
    authorize @expense_category

    if @expense_category.save
      render json: { expense_category: @expense_category, notice: "Expense category created successfully" }, status: 200
    else
      render json: { errors: @expense_category.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def update
    authorize @expense_category

    if @expense_category.update(expense_category_params)
      render json: { expense_category: @expense_category, notice: "Expense category updated successfully" }, status: 200
    else
      render json: { errors: @expense_category.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def destroy
    authorize @expense_category

    if @expense_category.discard
      render json: { notice: "Expense category deleted successfully" }, status: 200
    else
      render json: { errors: ["Failed to delete expense category"] }, status: :unprocessable_entity
    end
  end

  private

    def set_expense_category
      @expense_category = current_company.expense_categories.kept.find(params[:id])
    end

    def expense_category_params
      params.require(:expense_category).permit(:name, :description, :default_rate)
    end
end
