# frozen_string_literal: true

class InvoiceMailer < ApplicationMailer
  after_action -> { @invoice.sent! }

  def invoice
    @invoice = params[:invoice]
    recipients = params[:recipients]
    subject = params[:subject]
    @message = params[:message]

    pdf = InvoicePayment::PdfGeneration.process(@invoice, company_logo)
    attachments["invoice_#{@invoice.invoice_number}.pdf"] = pdf

    mail(to: recipients, subject:, reply_to: "no-reply@miru.com")
  end

  private

    def company_logo
      @invoice.company.logo.attached? ?
        polymorphic_url(@invoice.company.logo) :
        ""
    end
end
