# frozen_string_literal: true

class ClientPaymentMailer < ApplicationMailer
  before_action :email_within_rate_limit
  after_action :update_email_rate_limiter

  def payment
    @invoice = Invoice.find(params[:invoice_id])
    subject = params[:subject]
    @invoice_url = "#{ENV['APP_BASE_URL']}/invoices/#{@invoice.external_view_key}/view"
    @company = @invoice.company
    @company_logo = company_logo
    @amount = FormatAmountService.new(@company.base_currency, @invoice.amount).process
    @message = email_message

    if can_send_mail?
      mail(to: @invoice.client.email, subject:, reply_to: ENV["REPLY_TO_EMAIL"])

      @invoice.update_columns(client_payment_sent_at: DateTime.current)
    end
  end

  private

    def company_logo
      @invoice.company.logo.attached? ?
        polymorphic_url(@invoice.company.logo) :
        ""
    end

    def format_date
      @invoice.updated_at.strftime("%d.%m.%Y")
    end

    def email_message
      "Receipt of payment of #{@amount} on #{format_date} through online payment<br>against invoice number #{@invoice.invoice_number}"
    end

    def can_send_mail?
      @invoice.client_payment_sent_at.nil?
    end
end
