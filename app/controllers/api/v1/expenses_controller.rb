# frozen_string_literal: true

class Api::V1::ExpensesController < Api::V1::BaseController
  before_action :set_expense, only: [:show, :update, :destroy]

  def index
    authorize Expense

    expenses_data = Expenses::FetchService.new(current_company, params).process

    render json: {
      expenses: expenses_data[:expenses].map do |expense|
        {
          id: expense.id.to_s,
          amount: expense.amount.to_f,
          date: expense.formatted_date,
          description: expense.description,
          category: expense.expense_category.name,
          categoryId: expense.expense_category_id,
          vendor: expense.vendor&.name,
          vendorId: expense.vendor_id,
          status: "pending", # Default status - you may want to add this field to the model
          receipts: expense.attached_receipts_urls,
          expenseType: expense.expense_type == "business" ? "billable" : "non-billable",
          createdBy: expense.company.name,
          createdAt: expense.created_at.iso8601
        }
      end,
      categories: expenses_data[:categories].map { |c| { id: c.id, name: c.name } },
      vendors: expenses_data[:vendors].map { |v| { id: v.id, name: v.name } },
      pagination: expenses_data[:pagination_details]
    }
  end

  def create
    authorize Expense

    expense = current_company.expenses.create!(expense_params)

    render json: {
      expense: {
        id: expense.id,
        amount: expense.amount,
        date: expense.formatted_date,
        description: expense.description,
        expense_type: expense.expense_type,
        expense_category: {
          id: expense.expense_category.id,
          name: expense.expense_category.name
        },
        vendor: expense.vendor ? {
          id: expense.vendor.id,
          name: expense.vendor.name
        } : nil,
        receipts_urls: expense.attached_receipts_urls
      }
    }, status: 201
  end

  def show
    authorize @expense

    render json: {
      expense: {
        id: @expense.id,
        amount: @expense.amount,
        date: @expense.formatted_date,
        description: @expense.description,
        expense_type: @expense.expense_type,
        expense_category: {
          id: @expense.expense_category.id,
          name: @expense.expense_category.name
        },
        vendor: @expense.vendor ? {
          id: @expense.vendor.id,
          name: @expense.vendor.name
        } : nil,
        receipts_urls: @expense.attached_receipts_urls
      }
    }
  end

  def update
    authorize @expense

    @expense.update!(expense_params)

    render json: {
      message: I18n.t("expenses.update"),
      expense: {
        id: @expense.id,
        amount: @expense.amount,
        date: @expense.formatted_date,
        description: @expense.description,
        expense_type: @expense.expense_type,
        expense_category: {
          id: @expense.expense_category.id,
          name: @expense.expense_category.name
        },
        vendor: @expense.vendor ? {
          id: @expense.vendor.id,
          name: @expense.vendor.name
        } : nil,
        receipts_urls: @expense.attached_receipts_urls
      }
    }
  end

  def destroy
    authorize @expense

    @expense.destroy!

    render json: { message: I18n.t("expenses.destroy") }
  end

  private

    def expense_params
      params.require(:expense).permit(
        :amount, :date, :description, :expense_type, :expense_category_id, :vendor_id, receipts: []
      )
    end

    def set_expense
      @expense = current_company.expenses.find(params[:id])
    end
end
