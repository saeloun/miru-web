# frozen_string_literal: true

class SendPaymentReminderMailer < ApplicationMailer
  def send_payment_reminder
    @client = Client.find(params[:client_id])
    @invoices = @client.invoices.find(params[:selected_invoices])
    recipients = params[:recipients]
    @message = params[:message]
    @company = @client.company
    @company_logo = company_logo
    @amount = FormatAmountService.new(@company.base_currency, @invoices.first.amount).process

    # attachments["invoice_#{@invoice.invoice_number}.pdf"] = pdf

    mail(
      to: recipients,
      subject: params[:subject].presence || I18n.t("mailers.send_payment_reminder_mailer.send_payment_reminder.subject", company_name: @company.name),
      reply_to: default_reply_to_address
    )
  end

  private

    def company_logo
      attached_company_logo_url(@invoices.first.company)
    end
end
