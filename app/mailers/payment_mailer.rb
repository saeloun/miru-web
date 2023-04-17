# frozen_string_literal: true

class PaymentMailer < ApplicationMailer
  def payment
    @invoice = params[:invoice]
    recipients = recipients_with_role
    subject = params[:subject]
    @message = email_message
    @invoice_url = "#{ENV['APP_BASE_URL']}/invoices/#{@invoice.external_view_key}/view"
    @company = @invoice.company
    @company_logo = company_logo
    @amount = FormatAmountService.new(@company.base_currency, @invoice.amount).process

    attachments.inline["miruLogoWithText.png"] = File.read("public/miruLogoWithText.png")
    attachments.inline["Instagram.png"] = File.read("public/Instagram.png")
    attachments.inline["Twitter.png"] = File.read("public/Twitter.png")

    mail(to: recipients, subject:, reply_to: ENV["REPLY_TO_EMAIL"])
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
      "#{@invoice.client.name} has made a payment of #{@invoice.amount_paid} for<br>invoice #{@invoice.invoice_number} through Stripe. The invoice is paid in full now"
    end
end
