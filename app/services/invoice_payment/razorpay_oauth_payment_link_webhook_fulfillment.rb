# frozen_string_literal: true

class InvoicePayment::RazorpayOauthPaymentLinkWebhookFulfillment < InvoicePayment::RazorpayPaymentLinkWebhookFulfillment
  def initialize(payload:, signature:, account_id:)
    super(payload:, signature:)
    @account_id = account_id
  end

  # The caller verified the application signature. Any connected merchant can sign through that
  # application, so the invoice must be found by its stored link and bound to the signing account.
  def process
    return flag_unknown_link unless invoice&.razorpay_payment_link_account_id == @account_id
    return expire_payment_link if INACTIVE_LINK_EVENTS.include?(event)
    return true unless event == "payment_link.paid"

    payment = settle_new_payment
    send_payment_emails if payment.present? && invoice.paid?
    true
  rescue ActiveRecord::RecordInvalid => exception
    fail_with(exception.record.errors.full_messages.to_sentence)
  end

  private

    def invoice
      @_invoice ||= invoice_from_payment_link_id
    end

    def settle_new_payment
      invoice.reload
      invoice.with_lock do
        next if invoice.paid? || duplicate_payment?
        next flag_unverified_payment(invoice, "webhook_mismatch") unless verified_payment?

        InvoicePayment::Settle.process(payment_params, invoice).tap do
          invoice.update!(payment_infos: processed_payment_infos)
        end
      end
    end

    # A signed capture for a link Miru no longer tracks is real money for this merchant's invoice.
    def flag_unknown_link
      claimed = Invoice.kept.find_by(id: payment_link_notes["miru_invoice_id"]) if event == "payment_link.paid"
      account = claimed&.company&.payments_providers&.find_by(name: PaymentsProvider::RAZORPAY_PROVIDER)&.settings&.dig("oauth_account_id")
      flag_unverified_payment(claimed, "untracked_link") if claimed && !claimed.paid? && account == @account_id
      true
    end

    def flag_unverified_payment(target, reason)
      return unless payment["status"] == "captured" && payment_id.present?

      PaymentProviders::RazorpayPaymentReview.flag!(target, payment_id:, payment_link_id:, amount: payment["amount"], reason:)
      nil
    end

    def verified_payment?
      verification = PaymentProviders::RazorpayPaymentLinkVerification.new(invoice:, payment_link:, account_id: @account_id)
      verification.fully_paid? && payment_id.present? && payment["status"] == "captured" &&
        payment["currency"] == invoice.currency && payment["amount"] == payment_link["amount"]
    end

    def payment_params
      super.merge(provider_event_id: "razorpay:#{payment_id}")
    end
end
