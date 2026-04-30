# frozen_string_literal: true

class ExpenseMailer < ApplicationMailer
  def submitted
    load_expense
    recipients = params[:recipients]

    with_recipient_locale(recipient_user_from(recipients)) do
      mail(
        to: recipients,
        subject: I18n.t("mailers.expense_mailer.submitted.subject", submitter_name: @expense.submitter_name),
        reply_to: default_reply_to_address
      )
    end
  end

  def paid
    load_expense
    recipients = params[:recipients]

    with_recipient_locale(recipient_user_from(recipients)) do
      mail(
        to: recipients,
        subject: I18n.t("mailers.expense_mailer.paid.subject"),
        reply_to: default_reply_to_address
      )
    end
  end

  def approved
    load_expense
    recipients = params[:recipients]

    with_recipient_locale(recipient_user_from(recipients)) do
      mail(
        to: recipients,
        subject: I18n.t("mailers.expense_mailer.approved.subject"),
        reply_to: default_reply_to_address
      )
    end
  end

  def rejected
    load_expense
    recipients = params[:recipients]

    with_recipient_locale(recipient_user_from(recipients)) do
      mail(
        to: recipients,
        subject: I18n.t("mailers.expense_mailer.rejected.subject"),
        reply_to: default_reply_to_address
      )
    end
  end

  private

    def load_expense
      @expense = Expense.includes(:company, :user).find(params[:expense_id])
      @expense_url = "#{ENV['APP_BASE_URL']}/expenses/#{@expense.id}"
      @company = @expense.company
    end
end
