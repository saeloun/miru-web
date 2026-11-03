# frozen_string_literal: true

# Closes the payable OAuth link of an invoice that became paid, waived or deleted. It only records the
# outcome: the link ID, URL and account stay on the invoice so a later capture is still attributed.
class CancelRazorpayPaymentLinkJob < ApplicationJob
  queue_as :default

  retry_on PaymentProviders::RazorpayClient::Error, wait: :polynomially_longer, attempts: 5 do |job, error|
    Rails.error.report(error, handled: true, context: { invoice_id: job.arguments.first,
      recovery: "The Razorpay link may still be payable. A captured payment will appear under payments needing review." })
    raise error
  end

  def perform(invoice_id, payment_link_id, account_id)
    invoice = Invoice.find_by(id: invoice_id)
    return unless invoice && current_binding?(invoice, payment_link_id, account_id) &&
      PaymentProviders::RazorpayPaymentReview.closed_reason(invoice)

    status = PaymentProviders::RazorpayPaymentLinkCancellation.new(invoice:, payment_link_id:, account_id:).process
    invoice.with_lock do
      next unless current_binding?(invoice, payment_link_id, account_id)

      invoice.update_columns(payment_infos: invoice.payment_infos.merge("razorpay_payment_link_status" => status), updated_at: Time.current)
    end
  end

  private

    def current_binding?(invoice, payment_link_id, account_id)
      invoice.razorpay_payment_link_id == payment_link_id && invoice.razorpay_payment_link_account_id == account_id
    end
end
