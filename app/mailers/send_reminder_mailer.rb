# frozen_string_literal: true

class SendReminderMailer < ApplicationMailer
  def send_reminder
    @invoice = params[:invoice]
    @recipients = params[:recipients]
    subject = params[:subject]
    @message = params[:message]
    @invoice_url = "#{ENV['APP_BASE_URL']}/invoices/#{@invoice.external_view_key}/view"
    @company = @invoice.company
    @company_logo = company_logo
    @amount = FormatAmountService.new(@company.base_currency, @invoice.amount).process

    pdf = InvoicePayment::PdfGeneration.process(@invoice, @company_logo, root_url)
    attachments["invoice_#{@invoice.invoice_number}.pdf"] = pdf
    attachments.inline["miruLogoWithText.png"] = File.read("public/miruLogoWithText.png")
    attachments.inline["Instagram.png"] = File.read("public/Instagram.png")
    attachments.inline["Twitter.png"] = File.read("public/Twitter.png")

    mail(to: @recipients, subject:, reply_to: ENV["REPLY_TO_EMAIL"])
  end

  private

    def company_logo
      @invoice.company.logo.attached? ?
        polymorphic_url(@invoice.company.logo) :
        ""
    end
end
