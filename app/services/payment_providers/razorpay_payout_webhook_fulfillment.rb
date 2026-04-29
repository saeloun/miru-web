# frozen_string_literal: true

module PaymentProviders
  class RazorpayPayoutWebhookFulfillment
    STATUS_BY_EVENT = {
      "payout.pending" => :pending,
      "payout.queued" => :queued,
      "payout.initiated" => :processing,
      "payout.processed" => :processed,
      "payout.failed" => :failed,
      "payout.rejected" => :failed,
      "payout.reversed" => :reversed,
      "payout.cancelled" => :cancelled
    }.freeze

    attr_reader :payload, :signature, :error, :error_code

    def initialize(payload:, signature:)
      @payload = payload.to_s
      @signature = signature.to_s
    end

    def process
      return unsupported_event_success unless STATUS_BY_EVENT.key?(event)
      return fail_with("Razorpay payout not found") if payout.blank?
      return fail_with("Razorpay webhook secret is not configured") if provider&.webhook_secret.blank?
      return fail_with("Invalid Razorpay webhook signature", :invalid_signature) unless valid_signature?

      payout.update!(
        status: STATUS_BY_EVENT.fetch(event),
        failure_reason: failure_reason,
        raw_response: payout.raw_response.merge("webhook" => parsed_payload),
        processed_at: processed_at
      )
      true
    rescue JSON::ParserError
      fail_with("Invalid Razorpay webhook payload")
    rescue ActiveRecord::RecordInvalid => exception
      fail_with(exception.record.errors.full_messages.to_sentence)
    end

    private

      def parsed_payload
        @_parsed_payload ||= JSON.parse(payload)
      end

      def event
        parsed_payload["event"].to_s
      end

      def unsupported_event_success
        true
      end

      def payout
        @_payout ||= RazorpayPayout.find_by(external_id: payout_entity["id"].to_s)
      end

      def payout_entity
        @_payout_entity ||= parsed_payload.dig("payload", "payout", "entity") || {}
      end

      def provider
        @_provider ||= payout&.payment&.company&.payments_providers&.find_by(
          name: PaymentsProvider::RAZORPAY_PROVIDER,
          enabled: true
        )
      end

      def valid_signature?
        return false if signature.blank?

        PaymentProviders::RazorpayClient.new(provider:).verify_webhook_signature(
          payload:,
          signature:,
          webhook_secret: provider.webhook_secret
        )
      end

      def failure_reason
        payout_entity["failure_reason"].presence ||
          payout_entity.dig("status_details", "description").presence ||
          payout_entity.dig("error", "description").presence
      end

      def processed_at
        timestamp = payout_entity["processed_at"].presence
        return if timestamp.blank?

        Time.zone.at(timestamp.to_i)
      end

      def fail_with(message, code = nil)
        @error = message
        @error_code = code
        false
      end
  end
end
