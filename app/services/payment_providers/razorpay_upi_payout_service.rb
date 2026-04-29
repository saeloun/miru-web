# frozen_string_literal: true

module PaymentProviders
  class RazorpayUpiPayoutService
    attr_reader :provider, :amount, :recipient, :reference_id, :idempotency_key

    def initialize(provider:, amount:, recipient:, reference_id:, idempotency_key:)
      @provider = provider
      @amount = amount
      @recipient = recipient
      @reference_id = reference_id
      @idempotency_key = idempotency_key
    end

    def process
      raise ArgumentError, "Razorpay payouts are not enabled" unless provider.payouts_enabled?
      raise ArgumentError, "Razorpay payout account number is missing" if provider.payout_account_number.blank?
      raise ArgumentError, "UPI ID is missing" if upi_id.blank?
      raise ArgumentError, "Idempotency key is missing" if idempotency_key.blank?

      client.create_upi_payout(payout_payload, idempotency_key:)
    end

    private

      def payout_payload
        {
          account_number: provider.payout_account_number,
          amount: amount_subunits,
          currency: "INR",
          mode: "UPI",
          purpose: provider.payout_purpose.presence || "payout",
          fund_account: {
            account_type: "vpa",
            vpa: {
              address: upi_id
            },
            contact: {
              name: contact_name,
              email: contact_email,
              contact: contact_phone,
              type: "customer",
              reference_id:
            }.compact
          },
          queue_if_low_balance: provider.payout_queue_if_low_balance?,
          reference_id:,
          narration: "Miru payout"
        }
      end

      def amount_subunits
        (amount.to_d * Money::Currency.new("INR").subunit_to_unit).round.to_i
      end

      def upi_id
        recipient[:upi_id].presence || provider.payout_upi_id
      end

      def contact_name
        recipient.fetch(:name)
      end

      def contact_email
        recipient.fetch(:email)
      end

      def contact_phone
        recipient[:phone]
      end

      def client
        @_client ||= PaymentProviders::RazorpayClient.new(provider:)
      end
  end
end
