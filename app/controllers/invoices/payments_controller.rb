# frozen_string_literal: true

class Invoices::PaymentsController < ApplicationController
  skip_before_action :authenticate_user!
  skip_after_action :verify_authorized
  before_action :load_invoice
  before_action :ensure_invoice_unpaid, only: [:new]

  def new
    session = @invoice.create_checkout_session!(
      success_url: success_invoice_payments_url(@invoice),
      cancel_url: cancel_invoice_payments_url(@invoice)
    )

    redirect_to session.url, allow_other_host: true
  end

  def success
    if InvoicePayment::StripePaymentIntent.new(@invoice).process
      invoice_company = @invoice.client.company
      @invoice.send_to_payment_email(
        subject: "Payment details by #{@invoice.client.name}",
        message: email_message,
        recipients: invoice_company.users.with_role([:admin, :owner], invoice_company).pluck(:email)
      )
      flash[:notice] = t(".success")
    else
      flash[:error] = t(".failure")
      redirect_to root_path
    end
  end

  def cancel
    render
  end

  private

    def load_invoice
      @invoice = Invoice.includes(client: :company).find(params[:invoice_id])
    end

    def ensure_invoice_unpaid
      if @invoice.paid?
        redirect_to success_invoice_payments_url(@invoice.id)
      end
    end

    def email_message
      "#{@invoice.client.name} has made a payment of #{@invoice.amount_paid} for<br>invoice #{@invoice.invoice_number} through Stripe. The invoice is paid in full now"
    end
end
