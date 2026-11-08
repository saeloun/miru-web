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
    if event == "payment_link.paid"
      flag_unverified_payment(invoice.reload, "invoice_invalid")
      return true
    end
    fail_with(exception.record.errors.full_messages.to_sentence)
  end

  private

    def invoice
      # Includes deleted invoices: a signed capture on one is still real money to account for.
      @_invoice ||= payment_link_id.presence && Invoice.find_by("payment_infos ->> 'razorpay_payment_link_id' = ?", payment_link_id)
    end

    def settle_new_payment
      invoice.reload
      invoice.with_lock(requires_new: true) do
        next if duplicate_payment? || PaymentProviders::RazorpayPaymentReview.resolved?(invoice, payment_id)

        closed = PaymentProviders::RazorpayPaymentReview.closed_reason(invoice)
        next flag_unverified_payment(invoice, closed) if closed
        next flag_unverified_payment(invoice, "webhook_mismatch") unless verified_payment?

        InvoicePayment::Settle.process(payment_params, invoice).tap do
          invoice.update!(payment_infos: processed_payment_infos)
          PaymentProviders::RazorpayPaymentReview.discharge_settled!(invoice, payment_id)
        end
      end
    end

    # The invoice was read before its row lock, so a replacement link may have committed since.
    # Only the current link may be cleared, and a paid or deleted invoice keeps its references.
    def expire_payment_link
      invoice.with_lock do
        next unless invoice.razorpay_payment_link_id == payment_link_id && invoice.razorpay_payment_link_account_id == @account_id

        if PaymentProviders::RazorpayPaymentReview.closed_reason(invoice)
          invoice.update_columns(payment_infos: invoice.payment_infos.merge("razorpay_payment_link_status" => payment_link_status), updated_at: Time.current)
        else
          invoice.update!(razorpay_payment_link_id: nil, razorpay_payment_link_url: nil, razorpay_payment_link_status: payment_link_status)
        end
      end
      true
    end

    # A signed capture for a link Miru no longer tracks is real money for this merchant's invoice.
    def flag_unknown_link
      claimed = Invoice.find_by(id: payment_link_notes["miru_invoice_id"]) if event == "payment_link.paid"
      account = claimed&.company&.payments_providers&.find_by(name: PaymentsProvider::RAZORPAY_PROVIDER)&.settings&.dig("oauth_account_id")
      if claimed && account == @account_id
        flag_unverified_payment(claimed, PaymentProviders::RazorpayPaymentReview.closed_reason(claimed) || "untracked_link")
      end
      true
    end

    def flag_unverified_payment(target, reason)
      return unless payment["status"] == "captured" && payment_id.present?

      PaymentProviders::RazorpayPaymentReview.flag!(target, payment_id:, payment_link_id:, amount: payment["amount"], reason:,
        currency: payment["currency"].presence || payment_link["currency"])
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
