# frozen_string_literal: true

class PaymentMailer < ApplicationMailer
  def payment
    @invoice = Invoice.find(params[:invoice_id])
    recipients = recipients_with_role
    @invoice_url = "#{ENV['APP_BASE_URL']}/invoices/#{@invoice.external_view_key}/view"
    @company = @invoice.company
    @company_logo = company_logo
    @amount = FormatAmountService.new(@company.base_currency, @invoice.amount).process
    @message = email_message

    if can_send_mail?
      with_recipient_locale(recipient_user_from(recipients)) do
        mail(
          to: recipients,
          subject: params[:subject].presence || I18n.t("mailers.payment_mailer.payment.subject", invoice_number: @invoice.invoice_number),
          reply_to: default_reply_to_address
        )
      end

      @invoice.update_columns(payment_sent_at: DateTime.current)
    end
  end

  private

    def company_logo
      @invoice.company.logo.attached? ?
        polymorphic_url(@invoice.company.logo) :
        ""
    end

    def recipients_with_role
      client_company = @invoice.client.company
      client_company.users.with_role([:admin, :owner], client_company).pluck(:email)
    end

    def email_message
      I18n.t(
        "mailers.payment_mailer.payment.summary_html",
        client_name: @invoice.client.name,
        amount: @amount,
        invoice_number: @invoice.invoice_number
      )
    end

    def can_send_mail?
      @invoice.payment_sent_at.nil?
    end
end
