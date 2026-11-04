# frozen_string_literal: true

class ReconcileRazorpayPaymentLinksJob < ApplicationJob
  queue_as :default

  def perform
    return unless ENV["RAZORPAY_OAUTH_ENABLED"] == "true"

    Invoice.where("payment_infos -> '#{PaymentProviders::RazorpayPaymentLinkCreation::KEY}' IS NOT NULL").find_each do |invoice|
      reconcile(invoice) do |provider|
        PaymentProviders::RazorpayPaymentLinkCreation.new(invoice:, provider:).recover!
      end
    end
    Invoice.where("payment_infos ->> 'razorpay_payment_link_account_id' IS NOT NULL")
      .where("payment_infos ->> 'razorpay_payment_link_status' IS NULL OR payment_infos ->> 'razorpay_payment_link_status' IN ('created', 'partially_paid')").find_each do |invoice|
      next unless invoice.razorpay_link_cancellation_due?

      reconcile(invoice) { CancelRazorpayPaymentLinkJob.perform_now(invoice.id, invoice.razorpay_payment_link_id, invoice.razorpay_payment_link_account_id) }
    end
  end

  private

    def reconcile(invoice)
      provider = invoice.company.payments_providers.find_by(name: PaymentsProvider::RAZORPAY_PROVIDER)
      return unless provider&.razorpay_oauth? && provider.connected?

      yield provider
    rescue StandardError => error
      Rails.error.report(error, handled: true, context: { invoice_id: invoice.id, company_id: invoice.company_id,
        recovery: "Check the original Razorpay reference and payment link in Payment Settings." })
    end
end
