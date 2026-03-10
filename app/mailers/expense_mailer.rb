# frozen_string_literal: true

class ExpenseMailer < ApplicationMailer
  def submitted
    load_expense

    mail(
      to: params[:recipients],
      subject: "#{@expense.submitter_name} submitted a reimbursement request",
      reply_to: ENV["REPLY_TO_EMAIL"]
    )
  end

  def paid
    load_expense

    mail(
      to: params[:recipients],
      subject: "Your reimbursement has been marked as paid",
      reply_to: ENV["REPLY_TO_EMAIL"]
    )
  end

  def approved
    load_expense

    mail(
      to: params[:recipients],
      subject: "Your reimbursement has been approved",
      reply_to: ENV["REPLY_TO_EMAIL"]
    )
  end

  def rejected
    load_expense

    mail(
      to: params[:recipients],
      subject: "Your reimbursement needs updates before approval",
      reply_to: ENV["REPLY_TO_EMAIL"]
    )
  end

  private

    def load_expense
      @expense = Expense.includes(:company, :user, :expense_category, :vendor).find(params[:expense_id])
      @expense_url = "#{ENV['APP_BASE_URL']}/expenses/#{@expense.id}"
      @company = @expense.company
    end
end
