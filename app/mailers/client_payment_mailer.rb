# frozen_string_literal: true

class ClientPaymentMailer < ApplicationMailer
  def payment
    @invoice = Invoice.find(params[:invoice_id])
    @invoice_url = "#{ENV['APP_BASE_URL']}/invoices/#{@invoice.external_view_key}/view"
    @company = @invoice.company
    @company_logo = company_logo
    @amount = FormatAmountService.new(@company.base_currency, @invoice.amount).process
    @message = email_message

    if can_send_mail?
      mail(
        to: @invoice.client.email,
        subject: params[:subject].presence || I18n.t("mailers.client_payment_mailer.payment.subject", invoice_number: @invoice.invoice_number),
        reply_to: default_reply_to_address
      )

      @invoice.update_columns(client_payment_sent_at: DateTime.current)
    end
  end

  private

    def company_logo
      attached_company_logo_url(@invoice.company)
    end

    def format_date
      @invoice.updated_at.strftime("%d.%m.%Y")
    end

    def email_message
      I18n.t(
        "mailers.client_payment_mailer.payment.summary_html",
        amount: @amount,
        paid_on: format_date,
        invoice_number: @invoice.invoice_number
      )
    end

    def can_send_mail?
      @invoice.client_payment_sent_at.nil? && @invoice.client.email.present?
    end
end
