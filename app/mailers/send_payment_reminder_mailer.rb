# frozen_string_literal: true

class SendPaymentReminderMailer < ApplicationMailer
  def send_payment_reminder
    @invoices = Invoice.where(id: params[:selected_invoices])
    recipients = params[:recipients]
    subject = params[:subject]
    @message = params[:message]
    @company = @invoices.first.company
    @company_logo = company_logo
    @amount = FormatAmountService.new(@company.base_currency, @invoices.first.amount).process

    # pdf = InvoicePayment::PdfGeneration.process(@invoice, @company_logo, root_url)
    # attachments["invoice_#{@invoice.invoice_number}.pdf"] = pdf

    mail(to: recipients, subject:, reply_to: ENV["REPLY_TO_EMAIL"])
  end

  private

    def company_logo
      @invoices.first.company.logo.attached? ?
        polymorphic_url(@invoices.first.company.logo) :
        ""
    end
end
