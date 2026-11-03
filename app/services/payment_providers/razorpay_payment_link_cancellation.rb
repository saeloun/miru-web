# frozen_string_literal: true

module PaymentProviders
  # Closes one OAuth Payment Link and returns its confirmed final status, or raises
  # RazorpayClient::Error when the outcome is unknown. Review resolution performs its network
  # calls outside invoice locks; link replacement stays serialized with link creation.
  class RazorpayPaymentLinkCancellation
    CANCELLABLE_STATUSES = %w[created partially_paid].freeze
    FINAL_STATUSES = %w[cancelled expired paid].freeze

    def initialize(invoice:, payment_link_id:, account_id:)
      @invoice = invoice
      @payment_link_id = payment_link_id
      @account_id = account_id
    end

    def process(link = nil)
      link ||= client.fetch_payment_link(@payment_link_id)
      verify_link!(link)
      RazorpayPaymentReview.flag_link_captures!(@invoice, link, reason: RazorpayPaymentReview.closed_reason(@invoice) || "paid_link_mismatch")
      if CANCELLABLE_STATUSES.include?(link["status"])
        link = client.cancel_payment_link(@payment_link_id)
        verify_link!(link)
        RazorpayPaymentReview.flag_link_captures!(@invoice, link, reason: RazorpayPaymentReview.closed_reason(@invoice) || "paid_link_mismatch")
      end
      status = link["status"]
      raise RazorpayClient::Error, "Razorpay did not confirm the payment link outcome" unless FINAL_STATUSES.include?(status)

      status
    end

    private

      def verify_link!(link)
        return if RazorpayPaymentLinkVerification.new(invoice: @invoice, payment_link: link, account_id: @account_id).belongs_to_invoice?

        raise RazorpayClient::Error, "Razorpay payment link does not belong to this invoice"
      end

      def client
        @_client ||= begin
          provider = @invoice.company.payments_providers.find_by(name: PaymentsProvider::RAZORPAY_PROVIDER)
          unless provider&.razorpay_oauth? && provider.settings["oauth_account_id"] == @account_id
            raise RazorpayClient::Error, "Razorpay account connection does not match this payment link"
          end

          RazorpayClient.new(provider:)
        end
      end
  end
end
