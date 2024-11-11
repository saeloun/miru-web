# frozen_string_literal: true

class PaymentMailer < ApplicationMailer
  before_action :email_within_rate_limit
  after_action :update_email_rate_limiter

  def payment
    @invoice = Invoice.find(params[:invoice_id])
    recipients = recipients_with_role
    subject = params[:subject]
    @invoice_url = "#{ENV['APP_BASE_URL']}/invoices/#{@invoice.external_view_key}/view"
    @company = @invoice.company
    @company_logo = company_logo
    @amount = FormatAmountService.new(@company.base_currency, @invoice.amount).process
    @message = email_message

    if can_send_mail?
      mail(to: recipients, subject:, reply_to: ENV["REPLY_TO_EMAIL"])

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
      "#{@invoice.client.name} has made a payment of #{@amount} for<br>invoice #{@invoice.invoice_number} through Stripe. The invoice is paid in full now"
    end

    def can_send_mail?
      @invoice.payment_sent_at.nil?
    end
end
