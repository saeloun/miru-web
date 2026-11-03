# frozen_string_literal: true

# Closes an OAuth link after its invoice closes or changes. Closed invoices retain their binding;
# open invoices may replace a confirmed closed link, with financial evidence retained in reviews/audits.
class CancelRazorpayPaymentLinkJob < ApplicationJob
  queue_as :default

  retry_on PaymentProviders::RazorpayClient::Error, wait: :polynomially_longer, attempts: 5 do |job, error|
    Rails.error.report(error, handled: true, context: { invoice_id: job.arguments.first,
      recovery: "The Razorpay link may still be payable. A captured payment will appear under payments needing review." })
    raise error
  end

  def perform(invoice_id, payment_link_id, account_id)
    invoice = Invoice.find_by(id: invoice_id)
    return unless invoice && current_binding?(invoice, payment_link_id, account_id) && invoice.razorpay_link_cancellation_due?

    status = PaymentProviders::RazorpayPaymentLinkCancellation.new(invoice:, payment_link_id:, account_id:).process
    invoice.with_lock do
      next unless current_binding?(invoice, payment_link_id, account_id)

      infos = invoice.payment_infos.merge("razorpay_payment_link_status" => status)
      if !PaymentProviders::RazorpayPaymentReview.closed_reason(invoice) && !PaymentProviders::RazorpayPaymentReview.pending?(invoice)
        infos["razorpay_payment_link_id"] = nil
        infos["razorpay_payment_link_url"] = nil
      end
      invoice.update_columns(payment_infos: infos, updated_at: Time.current)
    end
  end

  private

    def current_binding?(invoice, payment_link_id, account_id)
      invoice.razorpay_payment_link_id == payment_link_id && invoice.razorpay_payment_link_account_id == account_id
    end
end
