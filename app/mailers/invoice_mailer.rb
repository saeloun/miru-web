# frozen_string_literal: true

class InvoiceMailer < ApplicationMailer
  after_action -> { @invoice.sent! }

  def invoice
    @invoice = params[:invoice]
    recipients = params[:recipients]
    subject = params[:subject]
    @message = params[:message]
    @invoice_url = "#{ENV.fetch("APP_BASE_URL", "getmiru.com")}/invoices/#{@invoice.id}/view"

    pdf = InvoicePayment::PdfGeneration.process(@invoice, company_logo)
    attachments["invoice_#{@invoice.invoice_number}.pdf"] = pdf
    attachments.inline["miruLogoWithText.svg"] = File.read("public/miruLogoWithText.svg")
    attachments.inline["Instagram.svg"] = File.read("public/Instagram.svg")
    attachments.inline["Twitter.svg"] = File.read("public/Twitter.svg")

    mail(to: recipients, subject:, reply_to: "no-reply@miru.com")
  end

  private

    def company_logo
      @invoice.company.logo.attached? ?
        polymorphic_url(@invoice.company.logo) :
        ""
    end
end
