# frozen_string_literal: true

class Invoices::PaymentsController < ApplicationController
  skip_before_action :authenticate_user!
  skip_after_action :verify_authorized
  before_action :load_invoice
  before_action :ensure_invoice_unpaid, only: [:new]

  def new
    if @invoice.razorpay_payment_review_required?
      return redirect_to cancel_invoice_payments_url(@invoice.external_view_key, reason: "confirming")
    end
    unless @invoice.payment_options_available? || PaymentProviders::RazorpayPaymentLinkCreation.pending?(@invoice)
      return redirect_to cancel_invoice_payments_url(@invoice.external_view_key, reason: "start")
    end

    payment_terms = @invoice.slice(:currency, :amount_due)
    destination = payment_url
    @invoice.reload
    remove_instance_variable(:@_razorpay_provider) if instance_variable_defined?(:@_razorpay_provider)
    if @invoice.discarded? || @invoice.waived? || @invoice.razorpay_link_cancellation_due? ||
        PaymentProviders::RazorpayPaymentLinkCreation.pending?(@invoice) || @invoice.razorpay_payment_review_required?
      return redirect_to cancel_invoice_payments_url(@invoice.external_view_key, reason: "confirming")
    end
    return redirect_to request.base_url + "/invoices/#{@invoice.external_view_key}/payments/success" if @invoice.paid?
    unless @invoice.payment_options_available? && @invoice.slice(:currency, :amount_due) == payment_terms
      return redirect_to cancel_invoice_payments_url(@invoice.external_view_key, reason: "start")
    end

    redirect_to destination, allow_other_host: true
  rescue PaymentProviders::RazorpayClient::Error, PaymentProviders::PaypalClient::Error, Stripe::StripeError => error
    Rails.logger.warn(
      "[Payments] could not start payment invoice_id=#{@invoice.id} provider=#{params[:provider]} " \
      "error_class=#{error.class} error=#{error.message}"
    )
    redirect_to payment_start_failure_url(error)
  end

  def cancel
    @unconfirmed_payment = params[:reason] == "capture"
    @payment_not_started = params[:reason] == "start"
    @payment_confirming = params[:reason] == "confirming"
    render
  end

  def razorpay_success
    recover_pending_razorpay_link if PaymentProviders::RazorpayPaymentLinkCreation.pending?(@invoice)
    fulfilled = InvoicePayment::RazorpayPaymentLinkFulfillment.process(
      invoice: @invoice,
      params:
    )

    if razorpay_payment_unconfirmed?(fulfilled)
      return redirect_to cancel_invoice_payments_url(@invoice.external_view_key, reason: "confirming")
    end

    redirect_url = razorpay_settled_url
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
      redirect_to request.base_url + "/invoices/#{@invoice.external_view_key}/view", allow_other_host: false
    else
      Rails.logger.warn(
        "[PayPal] capture failed invoice_id=#{@invoice.id} order_id=#{params[:token]} error=#{fulfillment.error}"
      )
      redirect_to cancel_invoice_payments_url(@invoice.external_view_key, reason: "capture")
    end
  end

  private

    def razorpay_settled_url
      request.base_url + "/invoices/#{@invoice.external_view_key}/payments/success?provider=razorpay"
    end

    # Only OAuth invoices store an account, so the API-key return path is unchanged.
    def razorpay_payment_unconfirmed?(fulfilled)
      @invoice.reload
      return true if PaymentProviders::RazorpayPaymentLinkCreation.pending?(@invoice)
      return false if @invoice.razorpay_payment_link_account_id.blank?

      !fulfilled || !@invoice.paid? || PaymentProviders::RazorpayPaymentReview.pending?(@invoice, params[:razorpay_payment_id].to_s)
    end

    def payment_start_failure_url(error)
      @invoice.reload
      return razorpay_settled_url if error.is_a?(PaymentProviders::RazorpayPaymentLinkService::PaymentConfirming) && @invoice.paid?

      cancel_invoice_payments_url(@invoice.external_view_key, reason: razorpay_payment_may_exist?(error) ? "confirming" : "start")
    end

    # An issued OAuth link we could not check may already be paid, so "not charged" would be a guess.
    def razorpay_payment_may_exist?(error)
      return true if error.is_a?(PaymentProviders::RazorpayPaymentLinkService::PaymentConfirming)

      PaymentProviders::RazorpayPaymentReview.pending?(@invoice) || PaymentProviders::RazorpayPaymentLinkCreation.pending?(@invoice) || bound_razorpay_link?
    end

    def bound_razorpay_link?
      @invoice.razorpay_payment_link_account_id.present? && @invoice.razorpay_payment_link_id.present?
    end

    def recover_pending_razorpay_link
      provider = @invoice.company.payments_providers.find_by(name: PaymentsProvider::RAZORPAY_PROVIDER)
      return unless provider&.razorpay_oauth?

      PaymentProviders::RazorpayPaymentLinkCreation.new(invoice: @invoice, provider:).recover!
    rescue PaymentProviders::RazorpayClient::Error
      # The intent remains visible to its administrators; an untrusted callback cannot clear it.
      nil
    end

    def load_invoice
      scope = Invoice.includes(client: :company)
      scope = scope.kept unless action_name == "razorpay_success" || (action_name == "cancel" && params[:reason] == "confirming")
      @invoice = scope.find_by!(external_view_key: params[:invoice_id])
    end

    def ensure_invoice_unpaid
      if @invoice.paid?
        redirect_to request.base_url + "/invoices/#{@invoice.external_view_key}/payments/success"
      end
    end

    def payment_url
      if PaymentProviders::RazorpayPaymentLinkCreation.pending?(@invoice)
        unless razorpay_provider&.razorpay_oauth?
          raise PaymentProviders::RazorpayPaymentLinkService::PaymentConfirming, "Reconnect the original Razorpay account to confirm this link"
        end
        return razorpay_payment_url
      end
      return upi_payment_url if params[:provider] == PaymentsProvider::UPI_PROVIDER
      return paypal_payment_url if paypal_requested? && paypal_provider.present?
      return razorpay_payment_url if razorpay_provider.present?
      return stripe_payment_url if stripe_onboarded?
      return paypal_payment_url if paypal_provider.present?

      stripe_payment_url
    end

    def stripe_onboarded?
      @invoice.company.stripe_connected_account&.details_submitted || false
    end

    def paypal_requested?
      params[:provider].to_s == PaymentsProvider::PAYPAL_PROVIDER
    end

    def upi_payment_url
      provider = @invoice.company.payments_providers.find_by(name: PaymentsProvider::UPI_PROVIDER, enabled: true)
      unless @invoice.currency == "INR" && @invoice.payment_options_available? && provider&.upi_configured? && provider.enabled_on_invoices?
        return cancel_invoice_payments_url(@invoice.external_view_key, reason: "start")
      end

      PaymentProviders::UpiIntentService.new(provider:, invoice: @invoice).payment_link
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
      @_paypal_provider = provider if provider&.paypal_ready_for_invoices?(@invoice.currency, @invoice.amount_due)
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
      provider&.razorpay_collectable?
    end
end
