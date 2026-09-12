# frozen_string_literal: true

class Invoices::PaymentsController < ApplicationController
  skip_before_action :authenticate_user!
  skip_after_action :verify_authorized
  before_action :load_invoice
  before_action :ensure_invoice_unpaid, only: [:new]

  def new
    redirect_to payment_url, allow_other_host: true
  rescue PaymentProviders::RazorpayClient::Error, PaymentProviders::PaypalClient::Error, Stripe::StripeError => error
    Rails.logger.warn("Payment link failed for invoice #{@invoice.id}: #{error.class} #{error.message}")
    redirect_to cancel_invoice_payments_url(@invoice.external_view_key), alert: "Unable to start the payment"
  end

  def cancel
    render
  end

  def razorpay_success
    fulfilled = InvoicePayment::RazorpayPaymentLinkFulfillment.process(
      invoice: @invoice,
      params:
    )

    redirect_url = request.base_url + "/invoices/#{@invoice.external_view_key}/payments/success?provider=razorpay"
    if fulfilled
      redirect_to redirect_url, allow_other_host: false
    else
      redirect_to redirect_url,
        allow_other_host: false,
        alert: "Unable to verify Razorpay payment"
    end
  end

  def paypal_return
    fulfillment = InvoicePayment::PaypalCaptureFulfillment.new(invoice: @invoice, order_id: params[:token].to_s)
    processed = fulfillment.process

    if processed && @invoice.reload.paid?
      redirect_to request.base_url + "/invoices/#{@invoice.external_view_key}/payments/success?provider=paypal",
        allow_other_host: false
    elsif processed
      # A part payment leaves a balance, so the success page would reject it. Send the payer back to the invoice.
      redirect_to request.base_url + "/invoices/#{@invoice.external_view_key}/view", allow_other_host: false
    else
      Rails.logger.warn("PayPal capture failed for invoice #{@invoice.id}: #{fulfillment.error}")
      redirect_to cancel_invoice_payments_url(@invoice.external_view_key), alert: "Unable to verify PayPal payment"
    end
  end

  private

    def load_invoice
      @invoice = Invoice.kept.includes(client: :company).find_by!(external_view_key: params[:invoice_id])
    end

    def ensure_invoice_unpaid
      if @invoice.paid?
        redirect_to request.base_url + "/invoices/#{@invoice.external_view_key}/payments/success"
      end
    end

    def payment_url
      return paypal_payment_url if paypal_requested? && paypal_provider.present?
      return razorpay_payment_url if razorpay_provider.present?
      return stripe_payment_url if stripe_onboarded?
      return paypal_payment_url if paypal_provider.present?

      stripe_payment_url
    end

    # A Stripe row exists from the moment someone clicks Connect Stripe, so presence alone would send
    # payers into a checkout the merchant never finished onboarding.
    def stripe_onboarded?
      @invoice.company.stripe_connected_account&.details_submitted || false
    end

    def paypal_requested?
      params[:provider].to_s == PaymentsProvider::PAYPAL_PROVIDER
    end

    def paypal_payment_url
      PaymentProviders::PaypalOrderService.new(
        invoice: @invoice,
        provider: paypal_provider,
        return_url: paypal_return_invoice_payments_url(@invoice.external_view_key),
        cancel_url: cancel_invoice_payments_url(@invoice.external_view_key)
      ).process
    end

    def razorpay_payment_url
      PaymentProviders::RazorpayPaymentLinkService.new(
        invoice: @invoice,
        provider: razorpay_provider,
        callback_url: razorpay_success_invoice_payments_url(@invoice.external_view_key)
      ).process
    end

    def stripe_payment_url
      @invoice.create_checkout_session!(
        success_url: request.base_url + "/invoices/#{@invoice.external_view_key}/payments/success",
        cancel_url: cancel_invoice_payments_url(@invoice.external_view_key)
      ).url
    end

    def paypal_provider
      return @_paypal_provider if instance_variable_defined?(:@_paypal_provider)

      provider = @invoice.company.payments_providers.find_by(name: PaymentsProvider::PAYPAL_PROVIDER, enabled: true)
      @_paypal_provider =
        if provider&.enabled_on_invoices? && provider.paypal_configured? && provider.connected? && PaymentsProvider.paypal_currency_supported?(@invoice.currency)
          provider
        end
    end

    def razorpay_provider
      return unless @invoice.currency == "INR"
      return @_razorpay_provider if instance_variable_defined?(:@_razorpay_provider)

      provider = @invoice.company.payments_providers.find_by(
        name: PaymentsProvider::RAZORPAY_PROVIDER,
        enabled: true
      )

      @_razorpay_provider =
        if enabled_and_configured_for_invoices?(provider)
          provider
        end
    end

    def enabled_and_configured_for_invoices?(provider)
      provider&.enabled_on_invoices? && provider.razorpay_configured?
    end
end
