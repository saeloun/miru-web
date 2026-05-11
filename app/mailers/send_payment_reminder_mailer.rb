# frozen_string_literal: true

class SendPaymentReminderMailer < ApplicationMailer
  def send_payment_reminder
    @invoices = Invoice.where(id: params[:selected_invoices])
    recipients = params[:recipients]
    @message = params[:message]
    @company = @invoices.first.company
    @company_logo = company_logo
    @amount = FormatAmountService.new(@company.base_currency, @invoices.first.amount).process

    # pdf = InvoicePayment::PdfGeneration.process(@invoice, @company_logo, root_url)
    # attachments["invoice_#{@invoice.invoice_number}.pdf"] = pdf

    mail(
      to: recipients,
      subject: params[:subject].presence || I18n.t("mailers.send_payment_reminder_mailer.send_payment_reminder.subject", company_name: @company.name),
      reply_to: default_reply_to_address
    )
  end

  private

    def company_logo
      attach_company_logo_inline(@invoices.first.company)
    end
end
