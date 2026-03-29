# frozen_string_literal: true

class Api::V1::ExpensesController < Api::V1::ApplicationController
  before_action :set_expense, only: [:show, :update, :destroy, :approve, :reject, :mark_paid]

  def index
    authorize Expense

    expenses = Expenses::FetchService.new(current_company, current_user, params).process

    render :index, locals: expenses
  end

  def create
    authorize Expense

    expense = current_company.expenses.create!(normalized_expense_params.merge(user: current_user))
    expense.notify_submission_reviewers!

    render :create, locals: {
      expense: Expense::ShowPresenter.new(expense).process
    }
  end

  def show
    authorize @expense

    render :show, locals: { expense: Expense::ShowPresenter.new(@expense).process }
  end

  def update
    authorize @expense

    @expense.update!(normalized_expense_params)
    resubmit_rejected_expense! if @expense.rejected? && @expense.user_id == current_user.id

    render json: { notice: I18n.t("expenses.update") }, status: 200
  end

  def destroy
    authorize @expense

    @expense.discard!

    render json: { notice: I18n.t("expenses.destroy") }, status: 200
  end

  def mark_paid
    authorize @expense, :mark_paid?

    unless @expense.approved?
      return render json: { error: I18n.t("expenses.must_be_approved") }, status: :unprocessable_entity
    end

    @expense.mark_paid!
    @expense.notify_submitter_paid!

    render json: {
      notice: I18n.t("expenses.mark_paid"),
      expense: Expense::ShowPresenter.new(@expense).process
    }, status: 200
  end

  def approve
    authorize @expense, :approve?

    @expense.approve!
    @expense.notify_submitter_approved!

    render json: {
      notice: I18n.t("expenses.approve"),
      expense: Expense::ShowPresenter.new(@expense).process
    }, status: 200
  end

  def reject
    authorize @expense, :reject?

    @expense.reject!
    @expense.notify_submitter_rejected!

    render json: {
      notice: I18n.t("expenses.reject"),
      expense: Expense::ShowPresenter.new(@expense).process
    }, status: 200
  end

  private

    def expense_params
      params.require(:expense).permit(
        :amount,
        :date,
        :description,
        :expense_type,
        :category_name,
        :vendor_name,
        receipts: []
      )
    end

    def set_expense
      @expense = current_company.expenses.kept.find(params[:id])
    end

    def resubmit_rejected_expense!
      @expense.update_columns(status: Expense.statuses[:submitted], paid_at: nil)
      @expense.notify_submission_reviewers!
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
