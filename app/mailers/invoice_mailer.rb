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
    @amount = FormatAmountService.new(@invoice.currency, @invoice.amount).process

    if can_send_invoice?
      pdf = InvoicePayment::PdfGeneration.process(@invoice, @company_logo, root_url)
      attachments["invoice_#{@invoice.invoice_number}.pdf"] = pdf

      mail(to: recipients, subject:, reply_to: ENV["REPLY_TO_EMAIL"])

      @invoice.update_columns(sent_at: DateTime.current)
    end
  end

  def send_invoice
    @invoice = params[:invoice]
    recipients = params[:recipients]
    subject = params[:subject]
    @message = params[:message]

    # Decode PDF data if it was encoded as base64
    pdf_data = if params[:pdf_encoded]
      Base64.strict_decode64(params[:pdf_data])
    else
      params[:pdf_data]
    end

    @invoice_url = "#{ENV['APP_BASE_URL']}/invoices/#{@invoice.external_view_key}/view"
    @company = @invoice.company
    @company_logo = @invoice.company.logo.attached? ?
      polymorphic_url(@invoice.company.logo) : ""
    @amount = FormatAmountService.new(@invoice.currency, @invoice.amount).process

    # Attach the PDF
    attachments["#{@invoice.invoice_number}.pdf"] = {
      mime_type: "application/pdf",
      content: pdf_data
    }

    mail(
      to: recipients,
      from: ENV["DEFAULT_FROM_EMAIL"] || "noreply@example.com",
      subject: subject,
      reply_to: ENV["REPLY_TO_EMAIL"]
    )
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
