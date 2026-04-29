# frozen_string_literal: true

class Invoices::PaymentsController < ApplicationController
  skip_before_action :authenticate_user!
  skip_after_action :verify_authorized
  before_action :load_invoice
  before_action :ensure_invoice_unpaid, only: [:new]

  def new
    payment_url = if razorpay_provider.present?
      PaymentProviders::RazorpayPaymentLinkService.new(
        invoice: @invoice,
        provider: razorpay_provider,
        callback_url: razorpay_success_invoice_payments_url(@invoice)
      ).process
    else
      session = @invoice.create_checkout_session!(
        success_url: request.base_url + "/invoices/#{@invoice.id}/payments/success",
        cancel_url: cancel_invoice_payments_url(@invoice)
      )
      session.url
    end

    redirect_to payment_url, allow_other_host: true
  rescue PaymentProviders::RazorpayClient::Error => error
    Rails.logger.warn(
      "Razorpay payment link failed for invoice #{@invoice.id}: #{error.message}"
    )
    redirect_to cancel_invoice_payments_url(@invoice),
      alert: "Unable to create Razorpay payment link"
  end

  def cancel
    render
  end

  def razorpay_success
    fulfilled = InvoicePayment::RazorpayPaymentLinkFulfillment.process(
      invoice: @invoice,
      params:
    )

    redirect_url = request.base_url + "/invoices/#{@invoice.id}/payments/success?provider=razorpay"
    if fulfilled
      redirect_to redirect_url, allow_other_host: false
    else
      redirect_to redirect_url,
        allow_other_host: false,
        alert: "Unable to verify Razorpay payment"
    end
  end

  private

    def load_invoice
      @invoice = Invoice.kept.includes(client: :company).find(params[:invoice_id])
    end

    def ensure_invoice_unpaid
      if @invoice.paid?
        redirect_to request.base_url + "/invoices/#{@invoice.id}/payments/success"
      end
    end

    def razorpay_provider
      @_razorpay_provider ||= @invoice.company.payments_providers.find_by(
        name: PaymentsProvider::RAZORPAY_PROVIDER,
        enabled: true
      ).presence if @invoice.currency == "INR"
    end
end
