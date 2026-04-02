# frozen_string_literal: true

class SendReminderMailer < ApplicationMailer
  def send_reminder
    @invoice = params[:invoice]
    recipients = params[:recipients]
    @message = params[:message]
    @invoice_url = "#{ENV['APP_BASE_URL']}/invoices/#{@invoice.external_view_key}/view"
    @company = @invoice.company
    @company_logo = company_logo
    @amount = FormatAmountService.new(@company.base_currency, @invoice.amount).process

    pdf = InvoicePayment::PdfGeneration.process(@invoice, @company_logo, root_url)
    attachments["invoice_#{@invoice.invoice_number}.pdf"] = pdf

    mail(
      to: recipients,
      subject: params[:subject].presence || I18n.t("mailers.send_reminder_mailer.send_reminder.subject", invoice_number: @invoice.invoice_number, company_name: @invoice.company.name),
      reply_to: ENV["REPLY_TO_EMAIL"]
    )
  end

  private

    def company_logo
      @invoice.company.logo.attached? ?
        polymorphic_url(@invoice.company.logo) :
        ""
    end
end
