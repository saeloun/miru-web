# frozen_string_literal: true

class InvoiceMailer < ApplicationMailer
  after_action :update_status, only: [:invoice]

  def invoice
    @invoice = Invoice.find(params[:invoice_id])
    recipients = params[:recipients]
    subject = params[:subject]
    @message = params[:message]
    @invoice_url = "#{ENV['APP_BASE_URL']}/invoices/#{@invoice.external_view_key}/view"
    @company = @invoice.company
    @company_logo = company_logo
    @amount = FormatAmountService.new(@company.base_currency, @invoice.amount).process

    if can_send_invoice?
      pdf = InvoicePayment::PdfGeneration.process(@invoice, @company_logo, root_url)
      attachments["invoice_#{@invoice.invoice_number}.pdf"] = pdf
      attachments.inline["miruLogoWithText.png"] = File.read("public/miruLogoWithText.png")
      attachments.inline["Instagram.png"] = File.read("public/Instagram.png")
      attachments.inline["Twitter.png"] = File.read("public/Twitter.png")

      mail(to: recipients, subject:, reply_to: ENV["REPLY_TO_EMAIL"])

      @invoice.update_columns(sent_at: DateTime.current)
    end
  end

  private

    def company_logo
      @invoice.company.logo.attached? ?
        polymorphic_url(@invoice.company.logo) :
        ""
    end

    def can_send_invoice?
      @invoice.sending? && @invoice.recently_sent_mail?
    end

    def update_status
      if @invoice.draft? || @invoice.viewed? || @invoice.declined? || @invoice.sending?
        @invoice.sent!
        @invoice.update_timesheet_entry_status!
      end
    end
end
