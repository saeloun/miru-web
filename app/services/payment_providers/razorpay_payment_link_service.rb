# frozen_string_literal: true

module PaymentProviders
  class RazorpayPaymentLinkService
    attr_reader :invoice, :provider, :callback_url

    def initialize(invoice:, provider:, callback_url:)
      @invoice = invoice
      @provider = provider
      @callback_url = callback_url
    end

    def process
      return existing_payment_link if existing_payment_link?

      response = create_payment_link_with_fallback
      invoice.update!(
        razorpay_payment_link_id: response.fetch("id"),
        razorpay_payment_link_url: response.fetch("short_url"),
        razorpay_payment_link_status: response["status"].presence || "created"
      )

      response.fetch("short_url")
    end

    private

      def existing_payment_link?
        invoice.razorpay_payment_link_id.present? && invoice.razorpay_payment_link_url.present?
      end

      def existing_payment_link
        payment_link = client.fetch_payment_link(invoice.razorpay_payment_link_id)
        if payment_link["status"].in?(["created", "partially_paid"])
          invoice.update!(razorpay_payment_link_status: payment_link["status"]) if invoice.razorpay_payment_link_status != payment_link["status"]
          return invoice.razorpay_payment_link_url
        end

        invoice.update!(
          razorpay_payment_link_id: nil,
          razorpay_payment_link_url: nil,
          razorpay_payment_link_status: payment_link["status"]
        )
        process
      rescue PaymentProviders::RazorpayClient::Error
        invoice.razorpay_payment_link_url
      end

      def payment_link_payload
        {
          amount: amount_subunits,
          currency: invoice.currency,
          accept_partial: false,
          description: "Invoice #{invoice.invoice_number} from #{invoice.company.name}",
          reference_id: reference_id,
          customer: customer_payload,
          notify: { sms: false, email: false },
          reminder_enable: true,
          callback_url:,
          callback_method: "get",
          notes: notes_payload
        }.tap do |payload|
          route_options = route_transfer_options
          payload[:options] = route_options if route_options.present?
        end
      end

      def minimal_payment_link_payload
        {
          amount: amount_subunits,
          currency: invoice.currency,
          accept_partial: false,
          description: "Invoice #{invoice.invoice_number} from #{invoice.company.name}",
          customer: customer_payload,
          notify: { sms: false, email: false },
          callback_url:,
          callback_method: "get"
        }
      end

      def create_payment_link_with_fallback
        client.create_payment_link(payment_link_payload)
      rescue PaymentProviders::RazorpayClient::Error => error
        raise error unless amount_whole_number_error?(error)

        Rails.logger.warn(
          "Retrying Razorpay payment link creation with minimal payload for invoice #{invoice.id}: #{error.message}"
        )
        client.create_payment_link(minimal_payment_link_payload)
      end

      def amount_whole_number_error?(error)
        error.message.to_s.downcase.include?("amount, should be a whole number")
      end

      def customer_payload
        {
          name: invoice.client.name,
          email: invoice.client.email
        }.compact
      end

      def notes_payload
        {
          miru_invoice_id: invoice.id.to_s,
          invoice_number: invoice.invoice_number.to_s,
          company_id: invoice.company_id.to_s,
          platform_fee_percent: platform_fee_percent.to_s
        }
      end

      def route_transfer_options
        return unless provider.route_transfers_enabled?

        transfer_amount = amount_subunits - platform_fee_subunits
        return if transfer_amount <= 0

        {
          order: {
            transfers: [
              {
                account: provider.linked_account_id,
                amount: transfer_amount,
                currency: invoice.currency,
                notes: {
                  miru_invoice_id: invoice.id.to_s,
                  miru_platform_fee_subunits: platform_fee_subunits.to_s
                }
              }
            ]
          }
        }
      end

      def amount_subunits
        (invoice.amount_due.to_d * subunit_to_unit).round.to_i
      end

      def platform_fee_subunits
        (amount_subunits * platform_fee_percent / 100).round
      end

      def platform_fee_percent
        BigDecimal(provider.platform_fee_percent.presence || "0")
      end

      def subunit_to_unit
        Money::Currency.new(invoice.currency).subunit_to_unit
      end

      def reference_id
        "miru-inv-#{invoice.id}"
      end

      def client
        @_client ||= PaymentProviders::RazorpayClient.new(provider:)
      end
  end
end
