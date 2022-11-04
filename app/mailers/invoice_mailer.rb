# frozen_string_literal: true

class InvoiceMailer < ApplicationMailer
  default reply_to: ENV["MAILER_REPLY_TO"] if ENV.fetch("MAILER_REPLY_TO", nil)
  after_action -> { @invoice.sent! }

  def invoice
    @invoice = params[:invoice]
    recipients = params[:recipients]
    subject = params[:subject]
    @message = params[:message]
    @invoice_url = view_invoice_url(@invoice.external_view_key)
    @company = @invoice.company
    @company_logo = company_logo
    @amount = FormatAmountService.new(@company.base_currency, @invoice.amount).process

    pdf = InvoicePayment::PdfGeneration.process(@invoice, @company_logo, root_url)
    attachments["invoice_#{@invoice.invoice_number}.pdf"] = pdf
    attachments.inline["miruLogoWithText.png"] = File.read("public/miruLogoWithText.png")
    attachments.inline["Instagram.png"] = File.read("public/Instagram.png")
    attachments.inline["Twitter.png"] = File.read("public/Twitter.png")

    mail(to: recipients, subject:)
  end

  private

    def company_logo
      @invoice.company.logo.attached? ?
        polymorphic_url(@invoice.company.logo) :
        ""
    end
end
