# frozen_string_literal: true

module PaymentProviders
  class RazorpayWithdrawalService
    ACTIVE_PAYOUT_STATUSES = %w[pending processing queued processed].freeze

    attr_reader :payment, :requested_by, :automatic

    def initialize(payment:, requested_by: nil, automatic: false)
      @payment = payment
      @requested_by = requested_by
      @automatic = automatic
    end

    def process
      return unless eligible_for_automatic_withdrawal?

      validate_withdrawal!

      payout = build_payout_attempt
      submit_payout(payout)
    end

    private

      def eligible_for_automatic_withdrawal?
        return true unless automatic

        razorpay_payment? && provider&.payouts_enabled?
      end

      def validate_withdrawal!
        raise Error, "Only Razorpay payments can be withdrawn through Razorpay payouts" unless razorpay_payment?
        raise Error, "Only INR payments can be withdrawn through Razorpay UPI payouts" unless currency == "INR"
        raise Error, "Razorpay payouts are not enabled" unless provider&.payouts_enabled?
        raise Error, "Razorpay payout account number is missing" if provider.payout_account_number.blank?
        raise Error, "Razorpay payout UPI ID is missing" if provider.payout_upi_id.blank?
      end

      def build_payout_attempt
        payment.with_lock do
          existing_active_payout || create_payout_attempt
        end
      end

      def existing_active_payout
        payment.razorpay_payouts.where(status: ACTIVE_PAYOUT_STATUSES).order(created_at: :desc).first
      end

      def create_payout_attempt
        payment.razorpay_payouts.create!(
          amount: payment.amount,
          currency:,
          status: :pending,
          triggered_by: automatic ? :automatic : :manual,
          reference_id:,
          idempotency_key: SecureRandom.uuid,
          mode: "UPI",
          recipient_upi_id: provider.payout_upi_id,
          recipient_name: recipient[:name],
          recipient_email: recipient[:email],
          recipient_phone: recipient[:phone],
          requested_by:
        )
      end

      def submit_payout(payout)
        return payout unless payout.pending?

        response = PaymentProviders::RazorpayUpiPayoutService.new(
          provider:,
          amount: payout.amount,
          recipient:,
          reference_id: payout.reference_id,
          idempotency_key: payout.idempotency_key
        ).process

        payout.update!(
          external_id: response["id"],
          status: normalize_status(response["status"]),
          failure_reason: failure_reason(response),
          raw_response: response,
          processed_at: processed_at(response)
        )
        payout
      rescue PaymentProviders::RazorpayClient::Error, ArgumentError => error
        payout.update!(
          status: :failed,
          failure_reason: error.message,
          raw_response: payout.raw_response.merge("error" => error.message)
        )
        payout
      end

      def normalize_status(status)
        normalized = status.to_s
        return :processing if normalized == "initiated"
        return :failed if normalized == "rejected"
        return normalized.to_sym if RazorpayPayout.statuses.key?(normalized)

        :processing
      end

      def failure_reason(response)
        response["failure_reason"].presence ||
          response.dig("status_details", "description").presence ||
          response.dig("error", "description").presence
      end

      def processed_at(response)
        timestamp = response["processed_at"].presence
        return if timestamp.blank?

        Time.zone.at(timestamp.to_i)
      end

      def reference_id
        prefix = automatic ? "auto" : "manual"
        "miru-p#{payment.id}-#{prefix}-#{Time.current.to_i}-#{SecureRandom.hex(2)}".first(40)
      end

      def recipient
        @_recipient ||= {
          name: company.name,
          email: requested_by&.email || company.users.first&.email || payment.invoice.client.email || "payments@miru.so",
          phone: company.business_phone.presence,
          upi_id: provider.payout_upi_id
        }.compact
      end

      def razorpay_payment?
        payment.transaction_type == "razorpay"
      end

      def currency
        payment.payment_currency.presence || payment.invoice.currency
      end

      def company
        payment.company
      end

      def provider
        @_provider ||= company.payments_providers.find_by(
          name: PaymentsProvider::RAZORPAY_PROVIDER,
          enabled: true
        )
      end

      class Error < StandardError; end
  end
end
