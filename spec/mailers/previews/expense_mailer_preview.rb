# frozen_string_literal: true

require_relative "preview_support"

class ExpenseMailerPreview < ActionMailer::Preview
  include PreviewSupport

  def submitted
    ExpenseMailer.with(expense_id: sample_expense.id, recipients: sample_recipients).submitted
  end

  def paid
    ExpenseMailer.with(expense_id: sample_expense.id, recipients: [sample_user.email]).paid
  end

  def approved
    ExpenseMailer.with(expense_id: sample_expense.id, recipients: [sample_user.email]).approved
  end

  def rejected
    ExpenseMailer.with(expense_id: sample_expense.id, recipients: [sample_user.email]).rejected
  end
end
