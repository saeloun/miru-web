# frozen_string_literal: true

class InvoiceMailer < ApplicationMailer
  after_action :update_status, only: [:invoice]

  def invoice
    @invoice = Invoice.find(params[:invoice_id])
    setup_invoice_email(message: params[:message])

    if can_send_invoice?
      pdf = InvoicePayment::PdfGeneration.process(@invoice, @company_logo, root_url)
      attachments["invoice_#{@invoice.invoice_number}.pdf"] = pdf

      deliver_invoice_email(
        recipients: params[:recipients],
        subject: params[:subject].presence || I18n.t("mailers.invoice_mailer.invoice.subject", invoice_number: @invoice.invoice_number)
      )

      @invoice.update_columns(sent_at: DateTime.current)
    end
  end

  def send_invoice
    @invoice = params[:invoice]
    setup_invoice_email(message: params[:message])
    attachments["#{@invoice.invoice_number}.pdf"] = {
      mime_type: "application/pdf",
      content: decoded_pdf_data
    }

    deliver_invoice_email(
      recipients: params[:recipients],
      subject: params[:subject].presence || I18n.t("mailers.invoice_mailer.send_invoice.subject", invoice_number: @invoice.invoice_number, company_name: @company.name)
    )
  end

  private

    def setup_invoice_email(message:)
      @message = message
      @company = @invoice.company
      @company_logo = company_logo
      @invoice_url = "#{ENV['APP_BASE_URL']}/invoices/#{@invoice.external_view_key}/view"
      @amount = FormatAmountService.new(@invoice.currency, @invoice.amount).process
    end

    def deliver_invoice_email(recipients:, subject:)
      mail(
        to: recipients,
        subject: subject,
        reply_to: default_reply_to_address
      )
    end

    def decoded_pdf_data
      return params[:pdf_data] unless params[:pdf_encoded]

      Base64.strict_decode64(params[:pdf_data])
    end

    def company_logo
      attached_company_logo_url(@company)
    end

    def can_send_invoice?
      @invoice.sending? && @invoice.recently_sent_mail?
    end

    def update_status
      return unless @invoice.draft? || @invoice.viewed? || @invoice.declined? || @invoice.sending?

      @invoice.sent!
      @invoice.update_timesheet_entry_status!
    end
end
